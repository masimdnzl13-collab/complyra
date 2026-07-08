import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type OrganizationDoc, type SubscriptionStatus } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { pricingPlans } from "@/config/site";

export const metadata = constructMetadata({
  title: "Subscriptions",
  path: "/admin/subscriptions",
  noIndex: true,
});

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  active: "bg-success/10 text-success",
  trialing: "bg-accent/10 text-accent",
  past_due: "bg-danger/10 text-danger",
  cancelled: "bg-navy-100 text-navy-500",
};

export default async function AdminSubscriptionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");
  if (user.userDoc.role !== "platform_admin") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-navy-900">Subscriptions</h1>
        <p className="mt-2 text-navy-600">This page is only available to platform admins.</p>
      </div>
    );
  }

  const orgsSnap = await getAdminFirestore().collection(firestorePaths.organizations()).get();
  const organizations = orgsSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as OrganizationDoc) }))
    .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());

  const payingOrgs = organizations.filter((o) => o.subscription.planId !== "free" && o.subscription.status !== "cancelled");
  const mrr = payingOrgs.reduce((sum, o) => {
    const plan = pricingPlans.find((p) => p.id === o.subscription.planId);
    if (!plan) return sum;
    const monthlyEquivalent = o.subscription.billingInterval === "year" ? plan.priceYearly / 12 : plan.price;
    return sum + monthlyEquivalent;
  }, 0);
  const trialingCount = organizations.filter((o) => o.subscription.status === "trialing").length;
  const pastDueCount = organizations.filter((o) => o.subscription.status === "past_due").length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Subscriptions</h1>
      <p className="mt-1 text-navy-600">All organizations and their billing state.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <StatCard label="Organizations" value={String(organizations.length)} />
        <StatCard label="Paying" value={String(payingOrgs.length)} />
        <StatCard label="MRR" value={`€${mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <StatCard label="Trialing / Past due" value={`${trialingCount} / ${pastDueCount}`} />
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-navy-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Interval</th>
              <th className="px-4 py-3">Next billing / ends</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => {
              const plan = pricingPlans.find((p) => p.id === org.subscription.planId);
              const dateField = org.subscription.status === "cancelled" ? org.subscription.currentPeriodEnd : org.subscription.nextBillingDate;
              return (
                <tr key={org.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-navy-900">{org.companyName}</td>
                  <td className="px-4 py-3 text-navy-700">{plan?.name ?? org.subscription.planId}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[org.subscription.status]}`}>
                      {org.subscription.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-500">{org.subscription.billingInterval ?? "—"}</td>
                  <td className="px-4 py-3 text-navy-500">{dateField ? dateField.toDate().toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-navy-500">{org.createdAt.toDate().toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-surface p-5">
      <p className="text-xs font-medium text-navy-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-navy-900">{value}</p>
    </div>
  );
}
