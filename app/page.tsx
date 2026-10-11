import Link from "next/link";
import { connection } from "next/server";
import { DigestView } from "@/components/DigestView";
import { getLatestDigest } from "@/lib/queries";

export default async function LatestDigestPage() {
  await connection();
  const digest = await getLatestDigest();

  if (!digest) {
    return (
      <p className="text-gray-700">
        No digest yet. Run one from{" "}
        <Link href="/settings" className="text-accent underline">
          Settings
        </Link>
        .
      </p>
    );
  }
  return <DigestView digest={digest} />;
}
