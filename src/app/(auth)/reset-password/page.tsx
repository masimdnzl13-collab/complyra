import { constructMetadata } from "@/lib/construct-metadata";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = constructMetadata({
  title: "Reset your password",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
