import fastGlob from "fast-glob";
import { fetchMetadata } from "./metadata";
import { type Report, printReport } from "./report";
import { getCommonPath, scan } from "./scan";

main().catch((err: unknown) => {
  console.error(`🚨 ${err}`);
  process.exit(255);
});

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    throw new Error("Provide a list of files to scan.");
  }

  const files = await fastGlob(args);
  const commonPath = getCommonPath(files);

  console.info();

  const metadata = await fetchMetadata();

  const label = `scanning ${files.length}`;
  console.time(label);
  let report: Report | null = null;
  try {
    report = await scan(files, metadata, commonPath);
  } finally {
    console.timeEnd(label);
  }
  console.info();
  console.info();

  if (!report) {
    return;
  }

  const summary = printReport(report);

  if (summary.broken > 0) {
    process.exit(1);
  }
}
