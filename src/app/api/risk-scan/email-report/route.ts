import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths } from "@/lib/firestore/schema";
import { evaluateRiskScan, isValidScanAnswers } from "@/lib/risk-scan/rules";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendRiskReportEmail } from "@/lib/email/send-report-email";
import { siteConfig } from "@/config/site";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`risk-scan-email:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { email, answers } = body as { email?: unknown; answers?: unknown };

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (!isValidScanAnswers(answers)) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  // Recomputed server-side rather than trusting client-supplied findings, so
  // the persisted report always matches this deterministic engine.
  const result = evaluateRiskScan(answers);

  const db = getAdminFirestore();
  const leadRef = db.collection(firestorePaths.leads()).doc();
  await leadRef.set({
    email: email.trim().toLowerCase(),
    answers,
    result,
    createdAt: FieldValue.serverTimestamp(),
    source: "risk-scan",
  });

  const reportUrl = new URL(`/report/${leadRef.id}`, siteConfig.url).toString();

  try {
    await sendRiskReportEmail({ to: email, reportUrl });
  } catch {
    return NextResponse.json(
      { error: "Report saved but the email could not be sent" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
