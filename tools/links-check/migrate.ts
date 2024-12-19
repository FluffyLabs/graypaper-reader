import * as fs from "node:fs";
import type { Report } from "./report";

export async function performMigrations(report: Report) {
  console.info("🚀 Starting link migrations...\n");
  console.time("Migrations took");

  for (const [filePath, links] of report.outdated) {
    const fileContent = await fs.promises.readFile(filePath, "utf-8");
    let updatedContent = fileContent;

    for (const link of links) {
      if (link.updated && link.migrated) {
        updatedContent = updatedContent.replace(link.url, link.updated);
      }
    }

    await fs.promises.writeFile(filePath, updatedContent, "utf-8");
    console.info(`  🔄 ${filePath}`);
  }

  console.info("\n🎉 Link migrations completed.");
  console.timeEnd("Migrations took");
}
