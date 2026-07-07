import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { constructMetadata } from "@/lib/construct-metadata";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = constructMetadata({
  title: "Sign in",
  path: "/login",
  noIndex: true,
});

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return <LoginForm />;
}
