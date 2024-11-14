import {fetchMetadata} from "./metadata";
import { printReport } from "./report";
import { getCommonPath, scan } from "./scan";


main()
  .catch((err: unknown) => {
    console.error(`🚨 ${err}`);
    process.exit(255);
  });

async function main() {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    throw new Error('Provide a list of files to scan.');
  }

  const metadata = await fetchMetadata();

  const label =`scanning ${files.length}`;
  const commonPath = getCommonPath(files);
  console.time(label);
  let report;
  try {
    report = await scan(files, metadata, commonPath);
  } finally {
    console.timeEnd(label);
  }
  console.info();
  printReport(report);
}
