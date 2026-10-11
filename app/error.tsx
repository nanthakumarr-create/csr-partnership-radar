"use client";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-white px-6 py-10 text-center">
      <p className="text-base font-semibold text-ink">Something went wrong</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
        The page could not load its data: {error.message || "unknown error"}.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-5 rounded-md border border-line-strong bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-accent hover:text-accent"
      >
        Try again
      </button>
    </div>
  );
}
