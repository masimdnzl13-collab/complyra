export default function DocumentsLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-6 py-16">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded bg-navy-100" />
        <div className="h-9 w-40 rounded-md bg-navy-100" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-navy-100 bg-navy-50" />
        ))}
      </div>
    </div>
  );
}
