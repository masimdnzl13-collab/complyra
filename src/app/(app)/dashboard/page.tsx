import { constructMetadata } from "@/lib/construct-metadata";

export const metadata = constructMetadata({
  title: "Dashboard",
  path: "/dashboard",
  noIndex: true,
});

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Dashboard</h1>
      <p className="mt-4 text-navy-600">
        Placeholder for the post-login application panel — authentication and
        product features will be added in a later step.
      </p>
    </div>
  );
}
