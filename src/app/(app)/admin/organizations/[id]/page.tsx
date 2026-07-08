import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  firestorePaths,
  type AiSystemDoc,
  type AuditLogEntryDoc,
  type OrganizationDoc,
  type UserDoc,
} from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { pricingPlans } from "@/config/site";
import { OrgActionButton, SendSupportEmailForm } from "@/components/admin/org-support-actions";

export const metadata = constructMetadata({
  title: "Organization detail",
  path: "/admin/organizations",
  noIndex: true,
});

interface PageProps {
  params: { id: string };
}

export default async function AdminOrganizationDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isSuperAdminUid(user.uid)) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-navy-900">403 — Forbidden</h1>
        <p className="mt-2 text-navy-600">This page is only available to the platform superadmin.</p>
      </div>
    );
  }

  const db = getAdminFirestore();
  const orgSnap = await db.doc(firestorePaths.organization(params.id)).get();
  if (!orgSnap.exists) notFound();
  const org = orgSnap.data() as OrganizationDoc;

  const [membersSnap, systemsSnap, auditSnap] = await Promise.all([
    db.collection(firestorePaths.users()).where("organizationId", "==", params.id).get(),
    db.collection(firestorePaths.aiSystems(params.id)).get(),
    db.collection(firestorePaths.auditLog(params.id)).orderBy("timestamp", "desc").limit(15).get(),
  ]);
  const members = membersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as UserDoc) }));
  const systems = systemsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as AiSystemDoc) }));
  const auditEntries = auditSnap.docs.map((d) => d.data() as AuditLogEntryDoc);
  const plan = pricingPlans.find((p) => p.id === org.subscription.planId);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">{org.companyName}</h1>
        {org.suspended && <span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">Suspended</span>}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Section title="Basic info">
          <Field label="Country">{org.country}</Field>
          <Field label="Industry">{org.industry}</Field>
          <Field label="Employees">{org.employeeCountRange}</Field>
          <Field label="EU relation">
            {org.euRelation.isEuBased ? "EU-based" : "Not EU-based"} · {org.euRelation.sellsToEu ? "Sells to EU" : "Doesn't sell to EU"}
          </Field>
          <Field label="Created">{org.createdAt.toDate().toLocaleDateString()}</Field>
        </Section>

        <Section title="Subscription">
          <Field label="Plan">{plan?.name ?? org.subscription.planId}</Field>
          <Field label="Status">{org.subscription.status}</Field>
          <Field label="Billing interval">{org.subscription.billingInterval ?? "—"}</Field>
          <Field label="Next billing date">
            {org.subscription.nextBillingDate ? org.subscription.nextBillingDate.toDate().toLocaleDateString() : "—"}
          </Field>
          <Field label="LemonSqueezy subscription ID">{org.subscription.lemonSqueezySubscriptionId ?? "—"}</Field>
          {org.subscription.trialStatus && <Field label="Trial status">{org.subscription.trialStatus}</Field>}
        </Section>

        <Section title="Usage this month">
          <Field label="Assessments">{org.usage.assessmentsThisMonth}</Field>
          <Field label="Documents">{org.usage.documentsGeneratedThisMonth}</Field>
          <Field label="Article 50 texts">{org.usage.article50TextsThisMonth}</Field>
          <Field label="Expert reviews">{org.usage.expertReviewsThisMonth}</Field>
          <Field label="AI systems registered">{org.usage.registeredSystemsCount}</Field>
        </Section>

        <Section title="Support actions">
          <div className="flex flex-wrap gap-2">
            <OrgActionButton orgId={params.id} action="reset_usage" label="Reset usage limits" />
            <OrgActionButton
              orgId={params.id}
              action="force_downgrade"
              label="Force downgrade to Free"
              confirmMessage="Force this organization to the Free plan?"
              danger
            />
            <OrgActionButton
              orgId={params.id}
              action="cancel_subscription"
              label="Cancel subscription"
              confirmMessage="Cancel this organization's subscription?"
              danger
            />
            <OrgActionButton
              orgId={params.id}
              action={org.suspended ? "unsuspend" : "suspend"}
              label={org.suspended ? "Unsuspend" : "Suspend"}
              confirmMessage={org.suspended ? undefined : "Suspend this organization's access?"}
              danger={!org.suspended}
            />
            <a
              href={`/api/admin/organizations/${params.id}/raw`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-navy-200 px-3 py-2 text-xs font-medium text-navy-700 hover:bg-navy-50"
            >
              View raw doc
            </a>
          </div>
          <div className="mt-3">
            <SendSupportEmailForm orgId={params.id} />
          </div>
        </Section>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Team members ({members.length})</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-4 py-3 text-navy-900">{m.email}</td>
                  <td className="px-4 py-3 text-navy-500">{m.role}</td>
                  <td className="px-4 py-3 text-navy-500">{m.createdAt.toDate().toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">AI systems ({systems.length})</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assessment</th>
              </tr>
            </thead>
            <tbody>
              {systems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-navy-500">
                    No systems registered.
                  </td>
                </tr>
              ) : (
                systems.map((s) => (
                  <tr key={s.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-4 py-3 text-navy-900">{s.name}</td>
                    <td className="px-4 py-3 text-navy-500">{s.status}</td>
                    <td className="px-4 py-3 text-navy-500">{s.assessmentStatus.replace("_", " ")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Recent activity</h2>
        {auditEntries.length === 0 ? (
          <p className="mt-3 text-sm text-navy-500">Nothing logged yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {auditEntries.map((entry, i) => (
              <li key={i} className="rounded-md border border-navy-100 bg-surface px-4 py-2.5 text-sm text-navy-700">
                {entry.action.replace(/_/g, " ")}
                <span className="ml-2 text-xs text-navy-400">{entry.timestamp.toDate().toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">{title}</h2>
      <div className="mt-3 space-y-2 rounded-xl border border-navy-100 bg-surface p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-navy-500">{label}</span>
      <span className="font-medium text-navy-900">{children}</span>
    </div>
  );
}
