export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6 px-6 py-16">
      <div className="h-8 w-56 rounded bg-navy-100" />
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="h-56 rounded-xl border border-navy-100 bg-navy-50" />
        <div className="h-56 rounded-xl border border-navy-100 bg-navy-50" />
      </div>
      <div className="h-40 rounded-xl border border-navy-100 bg-navy-50" />
    </div>
  );
}
