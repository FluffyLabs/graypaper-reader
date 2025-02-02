import * as fs from "node:fs";
import * as path from "node:path";
import { type Metadata, fetchMetadata } from "@fluffylabs/links-metadata";
import { program } from "commander";
import fastGlob from "fast-glob";
import ignore from "ignore";
import { performMigrations } from "./migrate";
import { generateNotes } from "./notes";
import { type Report, printReport } from "./report";
import { scan } from "./scan";

const TIME_GLOB = "resolving glob patterns";
const TIME_IGNORE = "resolving ignore patterns";
const TIME_METADATA = "fetching metadata";

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
    .option("--fail-on-broken", "Exit with an error code when broken links are detected.")
    .option("--version <name>", "Commit hash of specific version to update to (instead of latest)")
    .option("--write", "Modify the files and update reader links to requested/lastest versions.")
    .option("--fix", "Alias for --write.")
    .option("--generate-notes <file.json>", "Generate notes for the Gray Paper Reader")
    .action(async (paths, options) => {
      console.time(TIME_GLOB);
      let files = [];
      try {
        files = await fastGlob(paths);
      } finally {
        console.timeEnd(TIME_GLOB);
      }
      const globExpandedFileCount = files.length;

      if (options.ignoreFile) {
        console.time(TIME_IGNORE);
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
        console.timeEnd(TIME_IGNORE);
      }

      console.info();

      console.time(TIME_METADATA);
      let metadata: Metadata | null = null;
      try {
        metadata = await fetchMetadata();
      } finally {
        console.timeEnd(TIME_METADATA);
      }

      const label = `scanning ${files.length}${options.ignoreFile ? ` (${globExpandedFileCount - files.length} ignored)` : ""}`;
      console.time(label);
      let report: Report | null = null;
      try {
        report = await scan(files, metadata, options.version);
      } finally {
        console.timeEnd(label);
      }
      console.info();
      console.info();

      if (!report) {
        return;
      }

      if (options.generateNotes !== undefined) {
        console.info(`📓 Generating notes to ${options.generateNotes}`);
        const notes = generateNotes(report);
        const notesStr = JSON.stringify(notes, null, 2);
        fs.writeFileSync(options.generateNotes, notesStr);
      }

      const summary = printReport(report);

      if (options.write || options.fix) {
        await performMigrations(report);
      } else if (summary.broken > 0 && options.failOnBroken) {
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}
