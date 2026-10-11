export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse space-y-6">
      <span className="sr-only">Loading…</span>
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-line" />
        <div className="h-7 w-64 rounded bg-line" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-lg border border-line bg-white" />
        ))}
      </div>
      <div className="h-64 rounded-lg border border-line bg-white" />
    </div>
  );
}
