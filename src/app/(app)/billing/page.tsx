import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { pricingPlans } from "@/config/site";
import {
  CancelSubscriptionButton,
  InvoiceHistory,
  ManagePaymentMethodButton,
  PlanCheckoutButton,
} from "@/components/billing/billing-actions";

export const metadata = constructMetadata({
  title: "Billing",
  path: "/billing",
  noIndex: true,
});

function usageRow(label: string, used: number, limit: number | "unlimited") {
  const pct = limit === "unlimited" ? 0 : limit === 0 ? 100 : Math.min(100, Math.round((used / limit) * 100));
  return (
    <div key={label}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-navy-700">{label}</span>
        <span className="text-navy-500">
          {used} / {limit === "unlimited" ? "∞" : limit}
        </span>
      </div>
      {limit !== "unlimited" && (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  if (user.userDoc.role !== "owner") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-navy-900">Billing</h1>
        <p className="mt-2 text-navy-600">Only the organization owner can view and manage billing.</p>
      </div>
    );
  }

  const orgId = user.userDoc.organizationId;
  const orgSnap = await getAdminFirestore().doc(firestorePaths.organization(orgId)).get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  if (!organization) redirect("/onboarding");

  const { subscription, usage } = organization;
  const currentPlan = pricingPlans.find((p) => p.id === subscription.planId) ?? pricingPlans[0];
  const hasActiveSubscription = !!subscription.lemonSqueezySubscriptionId && subscription.status !== "cancelled";
  const paidPlans = pricingPlans.filter((p) => p.id !== "free");

  const trialDaysLeft =
    subscription.trialStatus === "active" && subscription.trialEndDate
      ? Math.max(0, Math.ceil((subscription.trialEndDate.toDate().getTime() - Date.now()) / 86_400_000))
      : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Billing</h1>
      <p className="mt-1 text-navy-600">Manage your Complyra plan, usage, and payment details.</p>

      {subscription.status === "past_due" && (
        <div className="mt-6 rounded-xl border-2 border-danger bg-danger/5 p-4 text-sm text-navy-900">
          Your last payment failed. Update your payment method to keep access to your plan&apos;s features.
        </div>
      )}
      {trialDaysLeft !== null && (
        <div className="mt-6 rounded-xl border-2 border-warning bg-warning/5 p-4 text-sm text-navy-900">
          Your {currentPlan.name} trial ends in {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"}. Add a payment
          method to continue without interruption.
        </div>
      )}
      {subscription.status === "cancelled" && subscription.currentPeriodEnd && (
        <div className="mt-6 rounded-xl border-2 border-navy-200 bg-navy-50 p-4 text-sm text-navy-900">
          Your subscription is cancelled and will end on {subscription.currentPeriodEnd.toDate().toLocaleDateString()}.
        </div>
      )}

      {/* Current plan + usage */}
      <div className="mt-8 rounded-xl border border-navy-100 bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-navy-500">Current plan</p>
            <p className="text-lg font-semibold text-navy-900">
              {currentPlan.name}
              {subscription.billingInterval && (
                <span className="ml-2 text-sm font-normal text-navy-500">billed {subscription.billingInterval}ly</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasActiveSubscription && <ManagePaymentMethodButton />}
            {hasActiveSubscription && <CancelSubscriptionButton />}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {usageRow("AI systems", usage.registeredSystemsCount, currentPlan.systemsLimit)}
          {usageRow("Risk assessments this month", usage.assessmentsThisMonth, currentPlan.assessmentsPerMonth)}
          {usageRow("Documents generated this month", usage.documentsGeneratedThisMonth, currentPlan.documentsPerMonth)}
          {usageRow("Article 50 AI texts this month", usage.article50TextsThisMonth, currentPlan.article50TextsPerMonth)}
        </div>
      </div>

      {/* Invoice history */}
      {hasActiveSubscription && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Invoice history</h2>
          <div className="mt-3">
            <InvoiceHistory />
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Plans</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {paidPlans.map((plan) => {
            const isCurrent = plan.id === currentPlan.id;
            const checkoutAvailable = !!plan.lemonSqueezy.variantIdMonthly;
            return (
              <div key={plan.id} className="flex flex-col rounded-xl border border-navy-100 bg-surface p-5">
                <p className="text-sm font-semibold text-navy-900">{plan.name}</p>
                <p className="mt-1 text-2xl font-semibold text-navy-900">
                  €{plan.price}
                  <span className="text-sm font-normal text-navy-500">/mo</span>
                </p>
                {plan.trialDays && !isCurrent && (
                  <p className="mt-1 text-xs text-accent">{plan.trialDays}-day free trial</p>
                )}
                <div className="mt-4 flex-1" />
                {isCurrent ? (
                  <span className="rounded-md bg-navy-100 px-4 py-2 text-center text-sm font-medium text-navy-600">
                    Current plan
                  </span>
                ) : checkoutAvailable ? (
                  <PlanCheckoutButton planId={plan.id} interval="month" label={`Switch to ${plan.name}`} />
                ) : (
                  <span className="rounded-md border border-dashed border-navy-200 px-4 py-2 text-center text-sm text-navy-400">
                    Coming soon
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
