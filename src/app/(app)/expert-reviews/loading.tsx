export default function ExpertReviewsLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-6 py-16">
      <div className="h-8 w-52 rounded bg-navy-100" />
      <div className="mt-2 h-4 w-72 rounded bg-navy-100" />
      <div className="mt-8 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-navy-100 bg-navy-50" />
        ))}
      </div>
    </div>
  );
}
