import Link from "next/link";
import { notFound } from "next/navigation";
import { DigestView } from "@/components/DigestView";
import { getDigest } from "@/lib/queries";

export default async function DigestPage(props: PageProps<"/digests/[id]">) {
  const { id } = await props.params;
  const digest = await getDigest(id);
  if (!digest) notFound();

  return (
    <div>
      <Link href="/digests" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
        ← All digests
      </Link>
      <DigestView digest={digest} eyebrow="Past digest" />
    </div>
  );
}
