"use client";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert">
      <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
      <p className="mt-2 text-gray-700">The page could not load its data: {error.message || "unknown error"}.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 rounded-[6px] border border-gray-300 px-3 py-1.5 text-sm text-gray-900 hover:border-accent"
      >
        Try again
      </button>
    </div>
  );
}
