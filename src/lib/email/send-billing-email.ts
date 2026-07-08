import "server-only";
import { siteConfig, brandColors } from "@/config/site";
import { getResendClient } from "./resend";

interface SendParams {
  to: string;
  subject: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

async function sendBillingEmail({ to, subject, bodyHtml, ctaLabel, ctaUrl }: SendParams) {
  const resend = getResendClient();
  // See send-invite-email.ts — Resend resolves { data: null, error } on failure instead of throwing.
  const { error } = await resend.emails.send({
    from: `${siteConfig.name} <${siteConfig.contact.email}>`,
    to,
    subject,
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
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
      </div>
    `,
  });
  if (error) throw new Error(error.message);
}

export async function sendWelcomeToPaidPlanEmail(params: { to: string; planName: string; nextBillingDate: string }) {
  await sendBillingEmail({
    to: params.to,
    subject: `Welcome to Complyra ${params.planName}!`,
    bodyHtml: `You now have access to everything on the ${params.planName} plan. Your next billing date: ${params.nextBillingDate}.`,
    ctaLabel: "Go to dashboard",
    ctaUrl: new URL("/dashboard", siteConfig.url).toString(),
  });
}

export async function sendPaymentFailedEmail(params: { to: string; updatePaymentUrl: string }) {
  await sendBillingEmail({
    to: params.to,
    subject: "Your Complyra subscription payment couldn't be processed",
    bodyHtml:
      "Your subscription payment couldn't be processed. Update your payment method within 3 days to keep your access.",
    ctaLabel: "Update payment method",
    ctaUrl: params.updatePaymentUrl,
  });
}

export async function sendRenewalReminderEmail(params: { to: string; planName: string; price: string; renewsAt: string }) {
  await sendBillingEmail({
    to: params.to,
    subject: "Your Complyra subscription renews soon",
    bodyHtml: `Your Complyra ${params.planName} subscription renews on ${params.renewsAt}. You'll be charged ${params.price}.`,
    ctaLabel: "Manage billing",
    ctaUrl: new URL("/billing", siteConfig.url).toString(),
  });
}

export async function sendCancellationConfirmationEmail(params: { to: string }) {
  await sendBillingEmail({
    to: params.to,
    subject: "Your Complyra subscription has been cancelled",
    bodyHtml: "Your subscription has been cancelled. You can resubscribe anytime — your data is kept as-is.",
    ctaLabel: "Resubscribe",
    ctaUrl: new URL("/billing", siteConfig.url).toString(),
  });
}

export async function sendTrialEndingEmail(params: { to: string; planName: string }) {
  await sendBillingEmail({
    to: params.to,
    subject: "Your Complyra trial ends in 3 days",
    bodyHtml: `Your 14-day ${params.planName} trial ends in 3 days. Add a payment method to continue without interruption.`,
    ctaLabel: "Add payment method",
    ctaUrl: new URL("/billing", siteConfig.url).toString(),
  });
}
