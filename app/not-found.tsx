import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Not found</h1>
      <p className="mt-2 text-gray-700">
        That digest does not exist.{" "}
        <Link href="/digests" className="text-accent underline">
          See all digests
        </Link>
        .
      </p>
    </div>
  );
}
