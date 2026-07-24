import "server-only";
import { siteConfig, brandColors } from "@/config/site";
import { getResendClient } from "./resend";

interface SendConsultantInviteEmailParams {
  to: string;
  inviteUrl: string;
}

export async function sendConsultantInviteEmail({ to, inviteUrl }: SendConsultantInviteEmailParams) {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: `${siteConfig.name} <${siteConfig.contact.transactionalFrom}>`,
    to,
    subject: `You've been invited to join the ${siteConfig.name} consultant network`,
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <p style="color: ${brandColors.navy[900]}; font-size: 20px; font-weight: 600; margin: 0 0 24px;">
          ${siteConfig.name}
        </p>
        <p style="color: ${brandColors.navy[900]}; font-size: 16px; line-height: 1.5; margin: 0 0 16px;">
          You've been invited to join the ${siteConfig.name} consultant network — helping companies work through
          borderline EU AI Act compliance questions.
        </p>
        <a href="${inviteUrl}"
           style="display: inline-block; background: ${brandColors.accent.DEFAULT}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 6px; margin: 8px 0 24px;">
          Set up your profile
        </a>
        <p style="color: ${brandColors.navy[500]}; font-size: 13px; line-height: 1.5; margin: 0;">
          This invite link expires in 14 days. If you weren't expecting this, you can ignore this email.
        </p>
      </div>
    `,
  });
  if (error) throw new Error(error.message);
}

interface SendCaseNotificationEmailParams {
  to: string;
  organizationName: string;
  briefSummary: string;
  preferredTurnaround: string;
}

/** Sent to matching consultants when a new expert-review request is submitted. */
export async function sendNewCaseNotificationEmail({
  to,
  organizationName,
  briefSummary,
  preferredTurnaround,
}: SendCaseNotificationEmailParams) {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: `${siteConfig.name} <${siteConfig.contact.transactionalFrom}>`,
    to,
    subject: `New consultation request: ${organizationName}`,
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <p style="color: ${brandColors.navy[900]}; font-size: 20px; font-weight: 600; margin: 0 0 24px;">
          ${siteConfig.name}
        </p>
        <p style="color: ${brandColors.navy[900]}; font-size: 16px; line-height: 1.5; margin: 0 0 8px;">
          New consultation request: <strong>${organizationName}</strong>
        </p>
        <p style="color: ${brandColors.navy[700]}; font-size: 14px; line-height: 1.5; margin: 0 0 8px;">
          ${briefSummary}
        </p>
        <p style="color: ${brandColors.navy[500]}; font-size: 13px; margin: 0 0 24px;">
          Preferred turnaround: ${preferredTurnaround}
        </p>
        <a href="${new URL("/consultant/dashboard", siteConfig.url).toString()}"
           style="display: inline-block; background: ${brandColors.accent.DEFAULT}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 6px;">
          View request
        </a>
      </div>
    `,
  });
  if (error) throw new Error(error.message);
}
