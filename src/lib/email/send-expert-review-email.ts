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

async function sendExpertReviewEmail({ to, subject, bodyHtml, ctaLabel, ctaUrl }: SendParams) {
  const resend = getResendClient();
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
          This is a documentation preparation tool, not legal advice. Expert reviews are provided by independent
          consultants, not Complyra.
        </p>
      </div>
    `,
  });
  if (error) throw new Error(error.message);
}

export async function sendProposalReceivedEmail(params: { to: string; consultantName: string; estimatedTotal: string }) {
  await sendExpertReviewEmail({
    to: params.to,
    subject: `${params.consultantName} sent a proposal for your expert review`,
    bodyHtml: `${params.consultantName} has proposed ${params.estimatedTotal} for your expert review request. Review the scope and accept or decline.`,
    ctaLabel: "View proposal",
    ctaUrl: new URL("/expert-reviews", siteConfig.url).toString(),
  });
}

export async function sendPaymentConfirmedToConsultantEmail(params: { to: string; caseId: string }) {
  await sendExpertReviewEmail({
    to: params.to,
    subject: "Payment confirmed — case ready for review",
    bodyHtml: `Payment has been confirmed for case ${params.caseId}. You can begin your review now.`,
    ctaLabel: "Open case",
    ctaUrl: new URL(`/consultant/cases/${params.caseId}`, siteConfig.url).toString(),
  });
}

export async function sendReviewStartedToUserEmail(params: { to: string; expectedCompletion: string }) {
  await sendExpertReviewEmail({
    to: params.to,
    subject: "Your expert review has started",
    bodyHtml: `Payment received — your expert review is now underway. Expected completion: ${params.expectedCompletion}.`,
    ctaLabel: "View request",
    ctaUrl: new URL("/expert-reviews", siteConfig.url).toString(),
  });
}

export async function sendReviewReadyEmail(params: { to: string; consultantName: string }) {
  await sendExpertReviewEmail({
    to: params.to,
    subject: "Your expert review is ready",
    bodyHtml: `${params.consultantName} has submitted your expert review. Read the full report and let us know how it went.`,
    ctaLabel: "View report",
    ctaUrl: new URL("/expert-reviews", siteConfig.url).toString(),
  });
}
