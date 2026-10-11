// Runs the real pipeline in dry-run mode: live sources, no DB writes, no email.
import { config } from "dotenv";
config({ path: ".env.local" });

import { runDigest } from "../lib/pipeline/runDigest";

async function main() {
  const started = Date.now();
  const result = await runDigest("manual", { dryRun: true });

  console.log("\n== Sources ==");
  for (const [name, s] of Object.entries(result.sourceStatus)) {
    console.log(`${name}: ${s.status}, ${s.count} items${s.error ? ` (${s.error})` : ""}`);
  }
  console.log("\n== Counts ==");
  console.log(result.counts);
  console.log(`status: ${result.status}`);

  console.log("\n== First 3 analysed items ==");
  for (const item of result.items.slice(0, 3)) {
    console.log(JSON.stringify(item, null, 2));
  }
  console.log(`\nFinished in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
