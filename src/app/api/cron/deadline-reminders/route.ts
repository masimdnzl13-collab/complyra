import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  firestorePaths,
  type AiSystemDoc,
  type Article50Artifact,
  type OrganizationDoc,
  type TrainingRecordDoc,
} from "@/lib/firestore/schema";
import { regulationDeadlines, siteConfig, planHasExpertReviewAccess } from "@/config/site";
import { getOrgOwnerEmail } from "@/lib/billing/org-owner";
import { canSendDeadlineReminder } from "@/lib/email/preferences";
import { sendDeadlineReminderEmail, sendDeadlineNowInEffectEmail, sendLiteracyReminderEmail } from "@/lib/email/send-automation-email";
import { authorizeCronRequest } from "@/lib/cron/authorize";
import { withCronRunLogging } from "@/lib/cron/log-run";

const REMINDER_DAYS = [30, 7];
const HIGH_RISK_REMINDER_DAYS = [90, 30, 7];

function daysUntil(isoDate: string, now: Date): number {
  return Math.round((new Date(isoDate).getTime() - now.getTime()) / 86_400_000);
}

/**
 * Runs daily at 08:00 UTC (see vercel.json). Cheap no-op on the ~358 days a
 * year none of the fixed deadlines are 90/30/7 days out and it isn't
 * Monday — the whole per-org scan only runs on days that actually matter.
 */
export async function GET(request: NextRequest) {
  const auth = await authorizeCronRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await withCronRunLogging("deadline-reminders", auth.triggeredBy, async (counters) => {
    const db = getAdminFirestore();
    const now = new Date();

    const transparency = regulationDeadlines.find((d) => d.id === "transparency")!;
    const watermarking = regulationDeadlines.find((d) => d.id === "watermarking")!;
    const highRisk = regulationDeadlines.find((d) => d.id === "high-risk")!;

    const transparencyDays = daysUntil(transparency.date, now);
    const watermarkingDays = daysUntil(watermarking.date, now);
    const highRiskDays = daysUntil(highRisk.date, now);

    const checkTransparency = REMINDER_DAYS.includes(transparencyDays);
    const checkWatermarking = REMINDER_DAYS.includes(watermarkingDays);
    const checkHighRisk = HIGH_RISK_REMINDER_DAYS.includes(highRiskDays);
    const transparencyJustPassed = transparencyDays === -1;
    const isMonday = now.getUTCDay() === 1;

    if (!checkTransparency && !checkWatermarking && !checkHighRisk && !transparencyJustPassed && !isMonday) {
      return { ok: true, skipped: "no deadline threshold or literacy day today" };
    }

    if (transparencyJustPassed) {
      await db.collection(firestorePaths.regulatoryUpdates()).add({
        title: "Article 50 transparency obligations are now in effect",
        summary:
          "As of today, AI systems that interact with people or generate synthetic content must disclose that fact under Article 50.",
        sourceUrl: new URL("/article-50", siteConfig.url).toString(),
        category: "transparency",
        publishedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    const orgsSnap = await db.collection(firestorePaths.organizations()).get();
    counters.processedCount = orgsSnap.size;

    const sendEmail = async (fn: () => Promise<void>) => {
      try {
        await fn();
        counters.emailsSent++;
      } catch {
        counters.emailsFailed++;
      }
    };

    let transparencyReminders = 0;
    let watermarkingReminders = 0;
    let highRiskReminders = 0;
    let nowInEffectNotices = 0;
    let literacyReminders = 0;

    for (const doc of orgsSnap.docs) {
      const org = doc.data() as OrganizationDoc;
      const orgId = doc.id;
      if (!canSendDeadlineReminder(org)) continue;

      if (checkTransparency || checkWatermarking || transparencyJustPassed) {
        const systemsSnap = await db.collection(firestorePaths.aiSystems(orgId)).get();
        const systems = systemsSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as AiSystemDoc) }))
          .filter((s) => s.status !== "retired");

        if (checkTransparency || transparencyJustPassed) {
          const chatbotSystems = systems.filter((s) => s.interactsWithPeople);
          if (chatbotSystems.length > 0) {
            const artifactsSnap = await db
              .collection(firestorePaths.article50Artifacts(orgId))
              .where("area", "==", "chatbot_disclosure")
              .where("isCurrent", "==", true)
              .get();
            const disclosedSystemIds = new Set(artifactsSnap.docs.map((d) => (d.data() as Article50Artifact).aiSystemId));
            const missing = chatbotSystems.filter((s) => !disclosedSystemIds.has(s.id));
            if (missing.length > 0 && checkTransparency) {
              const ownerEmail = await getOrgOwnerEmail(orgId);
              if (ownerEmail) {
                await sendEmail(() =>
                  sendDeadlineReminderEmail({
                    to: ownerEmail,
                    orgId,
                    deadlineTitle: transparency.title,
                    daysLeft: transparencyDays,
                    systemsCount: missing.length,
                    link: new URL("/article-50", siteConfig.url).toString(),
                  })
                );
                transparencyReminders++;
              }
            }
            if (missing.length > 0 && transparencyJustPassed) {
              const ownerEmail = await getOrgOwnerEmail(orgId);
              if (ownerEmail) {
                await sendEmail(() =>
                  sendDeadlineNowInEffectEmail({
                    to: ownerEmail,
                    orgId,
                    deadlineTitle: transparency.title,
                    link: new URL("/article-50", siteConfig.url).toString(),
                  })
                );
                nowInEffectNotices++;
              }
            }
          }
        }

        if (checkWatermarking) {
          const contentGenSystems = systems.filter((s) => s.generatesSyntheticContent);
          if (contentGenSystems.length > 0) {
            const watermarkSnap = await db
              .collection(firestorePaths.article50Artifacts(orgId))
              .where("area", "==", "watermark_checklist")
              .where("isCurrent", "==", true)
              .limit(1)
              .get();
            if (watermarkSnap.empty) {
              const ownerEmail = await getOrgOwnerEmail(orgId);
              if (ownerEmail) {
                await sendEmail(() =>
                  sendDeadlineReminderEmail({
                    to: ownerEmail,
                    orgId,
                    deadlineTitle: watermarking.title,
                    daysLeft: watermarkingDays,
                    systemsCount: contentGenSystems.length,
                    link: new URL("/article-50", siteConfig.url).toString(),
                  })
                );
                watermarkingReminders++;
              }
            }
          }
        }
      }

      if (checkHighRisk) {
        const assessmentsSnap = await db
          .collection(firestorePaths.assessments(orgId))
          .where("status", "==", "active")
          .where("riskTier", "==", "high")
          .get();
        if (assessmentsSnap.size > 0) {
          const ownerEmail = await getOrgOwnerEmail(orgId);
          if (ownerEmail) {
            await sendEmail(() =>
              sendDeadlineReminderEmail({
                to: ownerEmail,
                orgId,
                deadlineTitle: highRisk.title,
                daysLeft: highRiskDays,
                systemsCount: assessmentsSnap.size,
                link: new URL("/assessments", siteConfig.url).toString(),
              })
            );
            highRiskReminders++;
          }
        }
      }

      if (isMonday && planHasExpertReviewAccess(org.subscription.planId)) {
        const [usersSnap, trainingSnap] = await Promise.all([
          db.collection(firestorePaths.users()).where("organizationId", "==", orgId).get(),
          db.collection(firestorePaths.trainingRecords(orgId)).get(),
        ]);
        const totalTeamMembers = usersSnap.size;
        const completed = trainingSnap.docs.filter((d) => (d.data() as TrainingRecordDoc).completedAt).length;
        if (totalTeamMembers > 0 && completed < totalTeamMembers) {
          const ownerEmail = await getOrgOwnerEmail(orgId);
          if (ownerEmail) {
            await sendEmail(() =>
              sendLiteracyReminderEmail({ to: ownerEmail, orgId, notCompletedCount: totalTeamMembers - completed })
            );
            literacyReminders++;
          }
        }
      }
    }

    return {
      ok: true,
      ranAt: now.toISOString(),
      orgsScanned: orgsSnap.size,
      transparencyReminders,
      watermarkingReminders,
      highRiskReminders,
      nowInEffectNotices,
      literacyReminders,
    };
  });

  return NextResponse.json(result);
}
