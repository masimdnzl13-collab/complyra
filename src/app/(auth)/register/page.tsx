import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { constructMetadata } from "@/lib/construct-metadata";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = constructMetadata({
  title: "Create your account",
  path: "/register",
  noIndex: true,
});

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return <RegisterForm />;
}
