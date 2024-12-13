import { fetchMetadata } from "./metadata";
import { type Report, printReport } from "./report";
import { getCommonPath, scan } from "./scan";
import * as fs from "node:fs";
import * as path from "node:path";
import ignore from "ignore";
import fg from "fast-glob";
import { promptUserForMigration, performMigrations } from "./migrate";

main().catch((err: unknown) => {
  console.error(`🚨 ${err}`);
  process.exit(255);
});

async function findGitignore(startPath: string): Promise<string | null> {
  let currentPath = startPath;
  while (true) {
    const gitignorePath = path.join(currentPath, ".gitignore");
    try {
      await fs.promises.access(gitignorePath);
      return gitignorePath;
    } catch (err) {
      const parentPath = path.dirname(currentPath);
      if (parentPath === currentPath) {
        break;
      }
      currentPath = parentPath;
    }
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);

  const ignoreFileIndex = args.indexOf("--ignore-file");
  let ignorePatterns: string[] = [];

  const files =
    ignoreFileIndex === -1
      ? args
      : args.filter((arg, index) => index !== ignoreFileIndex && index !== ignoreFileIndex + 1);

  if (files.length === 0) {
    throw new Error("Provide a list of files to scan.");
  }

  const expandedFiles = await fg(files);
  const commonPath = getCommonPath(expandedFiles);

  if (ignoreFileIndex !== -1 && args[ignoreFileIndex + 1]) {
    const ignoreFilePath = args[ignoreFileIndex + 1];
    try {
      const ignoreFileContent = await fs.promises.readFile(path.resolve(ignoreFilePath), "utf-8");
      ignorePatterns = ignoreFileContent.split("\n").filter(Boolean);
      console.info(`Using ignore file: ${ignoreFilePath}`);
    } catch (err) {
      console.error(`Failed to read ignore file: ${err}`);
      process.exit(1);
    }
  } else {
    try {
      const gitignorePath = await findGitignore(commonPath);
      if (gitignorePath) {
        const gitignoreContent = await fs.promises.readFile(gitignorePath, "utf-8");
        ignorePatterns = gitignoreContent.split("\n").filter(Boolean);
        console.info(`Using .gitignore file: ${gitignorePath}`);
      } else {
        console.warn("No .gitignore file found.");
      }
    } catch (err) {
      console.warn(`Failed to read .gitignore file: ${err}`);
    }
  }

  console.info();

  const ig = ignore().add(ignorePatterns);
  const filteredFiles = expandedFiles.filter((file) => !ig.ignores(path.relative(commonPath, file)));

  const metadata = await fetchMetadata();

  const label = `scanning ${filteredFiles.length}`;
  console.time(label);
  let report: Report | null = null;
  try {
    report = await scan(filteredFiles, metadata, commonPath);
  } finally {
    console.timeEnd(label);
  }
  console.info();
  console.info();

  if (!report) {
    return;
  }

  printReport(report);

  const applyMigrations = await promptUserForMigration();
  if (applyMigrations) {
    await performMigrations(report, commonPath);
  }
}
