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
      <p className="mb-4 text-sm">
        <Link href="/digests" className="text-accent hover:underline">
          ← All digests
        </Link>
      </p>
      <DigestView digest={digest} />
    </div>
  );
}
