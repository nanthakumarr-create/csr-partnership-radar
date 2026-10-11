import Link from "next/link";
import { connection } from "next/server";
import { DigestView } from "@/components/DigestView";
import { EmptyState } from "@/components/ui";
import { getLatestDigest } from "@/lib/queries";

export default async function LatestDigestPage() {
  await connection();
  const digest = await getLatestDigest();

  if (!digest) {
    return (
      <EmptyState title="No digest yet">
        The first digest is created on Monday at 06:30 IST, or you can{" "}
        <Link href="/settings" className="font-medium text-accent underline">
          run one now from Settings
        </Link>
        .
      </EmptyState>
    );
  }
  return <DigestView digest={digest} eyebrow="This week" />;
}
