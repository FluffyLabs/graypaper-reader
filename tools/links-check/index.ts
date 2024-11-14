import {printReport, Report } from "./report";
import { scan } from "./scan";



const files = process.argv.slice(2);

if (files.length === 0) {
  throw new Error('Provide a list of files to scan.');
}

const label =`scanning ${files.length}`;
console.time(label);
scan(files)
  .then((res: Report) => {
    printReport(res);
  })
  .catch((err: unknown) => {
    console.error(`🚨 ${err}`);
  })
  .finally(() => {
    console.timeEnd(label);
  });
