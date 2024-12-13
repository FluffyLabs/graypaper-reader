import type { Report } from "./report";
import * as readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";

export async function promptUserForMigration(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Would you like to apply suggested migrations? (yes/no): ", (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes");
    });
  });
}

export async function performMigrations(report: Report, commonPath: string) {
  for (const [filePath, links] of report.outdated) {
    const absoluteFilePath = path.resolve(commonPath, filePath);
    const fileContent = await fs.promises.readFile(absoluteFilePath, "utf-8");
    let updatedContent = fileContent;

    for (const link of links) {
      if (link.updated && link.migrated) {
        updatedContent = updatedContent.replace(link.url, link.updated);
      }
    }

    await fs.promises.writeFile(absoluteFilePath, updatedContent, "utf-8");
    console.info(`Updated links in file: ${absoluteFilePath}`);
  }
}
