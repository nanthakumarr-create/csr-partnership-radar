import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <EmptyState title="Digest not found">
      That digest does not exist.{" "}
      <Link href="/digests" className="font-medium text-accent underline">
        See all digests
      </Link>
      .
    </EmptyState>
  );
}
