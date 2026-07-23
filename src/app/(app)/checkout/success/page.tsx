import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { pricingPlans } from "@/config/site";

export const metadata = constructMetadata({
  title: "Payment successful",
  path: "/checkout/success",
  noIndex: true,
});

export default async function CheckoutSuccessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const orgSnap = await getAdminFirestore().doc(firestorePaths.organization(user.userDoc.organizationId)).get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  const plan = pricingPlans.find((p) => p.id === organization?.subscription.planId);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
        <svg className="h-7 w-7 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mt-6 text-2xl font-semibold text-navy-900">Payment successful</h1>
      <p className="mt-2 text-navy-600">
        {plan ? `Welcome to Vermoncy ${plan.name}.` : "Your subscription is now active."} A confirmation email is on
        its way to {user.email}.
      </p>

      <div className="mt-8 w-full rounded-xl border border-navy-100 bg-surface p-5 text-left">
        <h2 className="text-sm font-semibold text-navy-900">What&apos;s next?</h2>
        <ul className="mt-3 space-y-2 text-sm text-navy-600">
          <li>Add your first AI system to the inventory</li>
          <li>Run a risk assessment against the EU AI Act</li>
          <li>Generate the compliance documents your risk tier requires</li>
        </ul>
      </div>

      <Link href="/dashboard" className="mt-8 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600">
        Go to dashboard
      </Link>
      <Link href="/billing" className="mt-3 text-sm font-medium text-navy-500 hover:text-navy-900">
        View billing details
      </Link>
    </div>
  );
}
