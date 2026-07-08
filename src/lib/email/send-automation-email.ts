import "server-only";
import { siteConfig, brandColors } from "@/config/site";
import { getResendClient } from "./resend";
import { buildOrgUnsubscribeUrl, buildNewsletterUnsubscribeUrl } from "./unsubscribe-token";

interface SendParams {
  to: string;
  subject: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
  accentColor?: string;
}

async function sendAutomationEmail({ to, subject, bodyHtml, ctaLabel, ctaUrl, unsubscribeUrl, accentColor }: SendParams) {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: `${siteConfig.name} <${siteConfig.contact.email}>`,
    to,
    subject,
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        ${
          accentColor
            ? `<div style="height: 4px; background: ${accentColor}; border-radius: 2px; margin: 0 0 24px;"></div>`
            : ""
        }
        <p style="color: ${brandColors.navy[900]}; font-size: 20px; font-weight: 600; margin: 0 0 24px;">
          ${siteConfig.name}
        </p>
        <p style="color: ${brandColors.navy[900]}; font-size: 16px; line-height: 1.5; margin: 0 0 16px;">
          ${bodyHtml}
        </p>
        ${
          ctaLabel && ctaUrl
            ? `<a href="${ctaUrl}" style="display: inline-block; background: ${brandColors.accent.DEFAULT}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 6px; margin: 8px 0 24px;">${ctaLabel}</a>`
            : ""
        }
        <p style="color: ${brandColors.navy[500]}; font-size: 13px; line-height: 1.5; margin: 0;">
          This is a documentation preparation tool, not legal advice.
        </p>
        ${
          unsubscribeUrl
            ? `<p style="color: ${brandColors.navy[300]}; font-size: 11px; margin: 16px 0 0;">
                <a href="${unsubscribeUrl}" style="color: ${brandColors.navy[300]};">Unsubscribe from this type of email</a>
              </p>`
            : ""
        }
      </div>
    `,
  });
  if (error) throw new Error(error.message);
}

export async function sendSubscriptionRenewedEmail(params: { to: string; planName: string; nextBillingDate: string }) {
  await sendAutomationEmail({
    to: params.to,
    subject: `Your Complyra ${params.planName} subscription has been renewed`,
    bodyHtml: `Your Complyra ${params.planName} subscription has been renewed for another billing period. Next billing date: ${params.nextBillingDate}.`,
    ctaLabel: "View billing",
    ctaUrl: new URL("/billing", siteConfig.url).toString(),
  });
}

export async function sendTrialConvertedEmail(params: { to: string; planName: string }) {
  await sendAutomationEmail({
    to: params.to,
    subject: "Thank you for becoming a paying Complyra customer!",
    bodyHtml: `Your card was charged successfully and your ${params.planName} trial has converted to a paid subscription. Thanks for sticking with Complyra.`,
    ctaLabel: "Go to dashboard",
    ctaUrl: new URL("/dashboard", siteConfig.url).toString(),
    accentColor: brandColors.success.DEFAULT,
  });
}

export async function sendPaymentOverdueEmail(params: { to: string; updatePaymentUrl: string }) {
  await sendAutomationEmail({
    to: params.to,
    subject: "Your Complyra subscription payment is overdue",
    bodyHtml: "Your subscription payment is overdue. Update your payment method within 3 days to avoid being downgraded to the Free plan.",
    ctaLabel: "Update payment method",
    ctaUrl: params.updatePaymentUrl,
    accentColor: brandColors.danger.DEFAULT,
  });
}

export async function sendTrialEndedEmail(params: { to: string }) {
  await sendAutomationEmail({
    to: params.to,
    subject: "Your Complyra trial has ended",
    bodyHtml: "Your 14-day trial has ended. You're now on the Free plan. Upgrade anytime to continue with full access.",
    ctaLabel: "Upgrade",
    ctaUrl: new URL("/billing", siteConfig.url).toString(),
  });
}

export async function sendSubscriptionDowngradedEmail(params: { to: string }) {
  await sendAutomationEmail({
    to: params.to,
    subject: "Your Complyra subscription has been downgraded to Free",
    bodyHtml: "Your subscription was downgraded to the Free plan due to an unpaid balance. Your data is untouched — reactivate anytime.",
    ctaLabel: "Reactivate",
    ctaUrl: new URL("/billing", siteConfig.url).toString(),
    accentColor: brandColors.danger.DEFAULT,
  });
}

export async function sendDeadlineReminderEmail(params: {
  to: string;
  orgId: string;
  deadlineTitle: string;
  daysLeft: number;
  systemsCount: number;
  link: string;
}) {
  await sendAutomationEmail({
    to: params.to,
    subject: `${params.deadlineTitle}: ${params.daysLeft} days away`,
    bodyHtml: `${params.deadlineTitle} obligations are ${params.daysLeft} days away. You have ${params.systemsCount} AI system${params.systemsCount === 1 ? "" : "s"} that may be affected. Start preparing now.`,
    ctaLabel: "Review now",
    ctaUrl: params.link,
    accentColor: params.daysLeft <= 7 ? brandColors.danger.DEFAULT : brandColors.warning.DEFAULT,
    unsubscribeUrl: buildOrgUnsubscribeUrl(params.orgId, "deadlineReminders"),
  });
}

export async function sendDeadlineNowInEffectEmail(params: { to: string; orgId: string; deadlineTitle: string; link: string }) {
  await sendAutomationEmail({
    to: params.to,
    subject: `${params.deadlineTitle} obligations are now in effect`,
    bodyHtml: `${params.deadlineTitle} obligations under the EU AI Act are now in effect. Make sure your compliance documentation is up to date.`,
    ctaLabel: "Review compliance status",
    ctaUrl: params.link,
    accentColor: brandColors.danger.DEFAULT,
    unsubscribeUrl: buildOrgUnsubscribeUrl(params.orgId, "deadlineReminders"),
  });
}

export async function sendLiteracyReminderEmail(params: { to: string; orgId: string; notCompletedCount: number }) {
  await sendAutomationEmail({
    to: params.to,
    subject: `${params.notCompletedCount} team members haven't completed AI Literacy training`,
    bodyHtml: `${params.notCompletedCount} team member${params.notCompletedCount === 1 ? "" : "s"} still ${params.notCompletedCount === 1 ? "hasn't" : "haven't"} completed AI Literacy training, required under Article 4.`,
    ctaLabel: "View training report",
    ctaUrl: new URL("/ai-literacy/reports", siteConfig.url).toString(),
    unsubscribeUrl: buildOrgUnsubscribeUrl(params.orgId, "deadlineReminders"),
  });
}

export async function sendRegulatoryUpdateEmail(params: { to: string; title: string; summary: string; sourceUrl: string }) {
  await sendAutomationEmail({
    to: params.to,
    subject: `New AI Act development: ${params.title}`,
    bodyHtml: `${params.summary}`,
    ctaLabel: "Read more",
    ctaUrl: params.sourceUrl,
    unsubscribeUrl: buildNewsletterUnsubscribeUrl(params.to),
  });
}

export async function sendWeeklyDigestEmail(params: {
  to: string;
  items: { title: string; summary: string; sourceUrl: string }[];
}) {
  const listHtml = params.items
    .map(
      (item) =>
        `<li style="margin-bottom: 12px;"><a href="${item.sourceUrl}" style="color: ${brandColors.accent.DEFAULT}; font-weight: 600; text-decoration: none;">${item.title}</a><br/><span style="color: ${brandColors.navy[600]}; font-size: 14px;">${item.summary}</span></li>`
    )
    .join("");
  await sendAutomationEmail({
    to: params.to,
    subject: `This week's AI Act updates: ${params.items.length} new development${params.items.length === 1 ? "" : "s"}`,
    bodyHtml: `Here's what changed in EU AI Act regulation this week: <ul style="padding-left: 18px; margin: 12px 0 0;">${listHtml}</ul>`,
    unsubscribeUrl: buildNewsletterUnsubscribeUrl(params.to),
  });
}
