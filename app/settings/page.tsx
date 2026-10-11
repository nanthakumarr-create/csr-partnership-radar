import { connection } from "next/server";
import { SettingsForm } from "@/components/SettingsForm";
import { loadSettings } from "@/lib/pipeline/loadSettings";

export default async function SettingsPage() {
  await connection();
  const settings = await loadSettings();

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-600">Changes apply from the next digest run.</p>
      <SettingsForm initial={settings} />
    </div>
  );
}
