import "server-only";
import { siteConfig, brandColors } from "@/config/site";
import { getResendClient } from "./resend";

interface SendRiskReportEmailParams {
  to: string;
  reportUrl: string;
}

export async function sendRiskReportEmail({ to, reportUrl }: SendRiskReportEmailParams) {
  const resend = getResendClient();

  // See send-invite-email.ts — Resend resolves { data: null, error } on
  // failure instead of throwing, so this must be checked explicitly.
  const { error } = await resend.emails.send({
    from: `${siteConfig.name} <${siteConfig.contact.transactionalFrom}>`,
    to,
    subject: "Your EU AI Act risk scan results",
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <p style="color: ${brandColors.navy[900]}; font-size: 20px; font-weight: 600; margin: 0 0 24px;">
          ${siteConfig.name}
        </p>
        <p style="color: ${brandColors.navy[900]}; font-size: 16px; line-height: 1.5; margin: 0 0 16px;">
          Your free EU AI Act risk scan is ready — a full breakdown of which obligations apply to
          your company, with the legal reference and deadline for each.
        </p>
        <a href="${reportUrl}"
           style="display: inline-block; background: ${brandColors.accent.DEFAULT}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 6px; margin: 8px 0 24px;">
          View your report
        </a>
        <p style="color: ${brandColors.navy[500]}; font-size: 13px; line-height: 1.5; margin: 0;">
          This is a preparation tool, not legal advice. The full disclaimer is on the report page.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }
}
