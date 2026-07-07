import "server-only";
import { siteConfig, brandColors } from "@/config/site";
import { getResendClient } from "./resend";

interface SendInviteEmailParams {
  to: string;
  organizationName: string;
  inviteUrl: string;
}

export async function sendInviteEmail({ to, organizationName, inviteUrl }: SendInviteEmailParams) {
  const resend = getResendClient();

  await resend.emails.send({
    from: `${siteConfig.name} <${siteConfig.contact.email}>`,
    to,
    subject: `You've been invited to join ${organizationName} on ${siteConfig.name}`,
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <p style="color: ${brandColors.navy[900]}; font-size: 20px; font-weight: 600; margin: 0 0 24px;">
          ${siteConfig.name}
        </p>
        <p style="color: ${brandColors.navy[900]}; font-size: 16px; line-height: 1.5; margin: 0 0 16px;">
          You've been invited to join <strong>${organizationName}</strong> on ${siteConfig.name},
          the platform for EU AI Act compliance documentation.
        </p>
        <a href="${inviteUrl}"
           style="display: inline-block; background: ${brandColors.accent.DEFAULT}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 6px; margin: 8px 0 24px;">
          Accept invitation
        </a>
        <p style="color: ${brandColors.navy[500]}; font-size: 13px; line-height: 1.5; margin: 0;">
          This invite link expires in 7 days. If you weren't expecting this, you can ignore this email.
        </p>
      </div>
    `,
  });
}
