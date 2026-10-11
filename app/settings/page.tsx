import { connection } from "next/server";
import { SettingsForm } from "@/components/SettingsForm";
import { PageHeader } from "@/components/ui";
import { loadSettings } from "@/lib/pipeline/loadSettings";

export default async function SettingsPage() {
  await connection();
  const settings = await loadSettings();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Configuration" title="Settings" meta="Changes apply from the next digest run." />
      <SettingsForm initial={settings} />
    </div>
  );
}
