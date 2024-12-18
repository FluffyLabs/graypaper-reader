import * as fs from "node:fs";
import * as path from "node:path";
import { program } from "commander";
import fastGlob from "fast-glob";
import ignore from "ignore";
import { fetchMetadata } from "./metadata";
import { type Report, printReport } from "./report";
import { scan } from "./scan";

main().catch((err: unknown) => {
  console.error(`🚨 ${err}`);
  process.exit(255);
});

async function main() {
  program
    .showHelpAfterError()
    .argument("<paths...>", "Paths of files to be scanned. Supports glob patterns.")
    .option(
      "--ignore-file <path>",
      "Path to a file containing patterns to ignore. Gitignore format applies. Patterns are resolved according to current working directory.",
    )
    .action(async (paths, options) => {
      let files = await fastGlob(paths);
      const globExpandedFileCount = files.length;

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
          files = files.filter((file) => {
            try {
              return !ignoreManager.ignores(path.relative(process.cwd(), file));
            } catch {
              console.warn(
                `Warning: Could not apply ignore patterns to ${file}. File might be outside of current working directory.`,
              );
              return true;
            }
          });
        }
      }

      console.info();

      const metadata = await fetchMetadata();

      const label = `scanning ${files.length}${options.ignoreFile ? ` (${globExpandedFileCount - files.length} ignored)` : ""}`;
      console.time(label);
      let report: Report | null = null;
      try {
        report = await scan(files, metadata);
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
}
