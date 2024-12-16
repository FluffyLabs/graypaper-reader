import * as fs from "node:fs";
import * as path from "node:path";
import fastGlob from "fast-glob";
import ignore from "ignore";
import { fetchMetadata } from "./metadata";
import { type Report, printReport } from "./report";
import { getCommonPath, scan } from "./scan";
import { program } from "commander";

main().catch((err: unknown) => {
  console.error(`🚨 ${err}`);
  process.exit(255);
});

async function main() {
  program
    .argument("<paths...>", "Paths of files to be scanned. Supports glob patterns.")
    .option("--ignore-file <path>", "Path to the ignore file.")
    .action(async (paths, options) => {
      let files = await fastGlob(paths);
      const commonPath = getCommonPath(files);

      if (options.ignoreFile) {
        let ignorePatterns: string[];

        try {
          const ignoreFileContent = await fs.promises.readFile(path.resolve(options.ignoreFile), "utf-8");
          ignorePatterns = ignoreFileContent.split("\n").filter(Boolean);
          console.info(`Using ignore file: ${options.ignoreFile}`);
        } catch (err) {
          console.error(`Failed to read ignore file: ${err}`);
          process.exit(1);
        }

        if (ignorePatterns.length) {
          const ignoreManager = ignore().add(ignorePatterns);
          files = files.filter((file) => !ignoreManager.ignores(path.relative(commonPath, file)));
        }
      }

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
    });

  await program.parseAsync(process.argv);

  if (!program.args.length) {
    program.help();
  }
}
