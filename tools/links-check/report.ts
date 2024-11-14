import type { Link } from "./metadata";

export type Path = string;

export type FileReport = {
  allLinks: Link[];
  outdated: Link[];
};

export type Report = {
  latestVersion: string;
  detected: Map<Path, Link[]>;
  outdated: Map<Path, Link[]>;
  failed: Map<Path, string>;
};

export function printReport(report: Report) {
  const total = Array.from(report.detected.values()).reduce((a, b) => a + b.length, 0);
  if (!report.outdated.size) {
    console.info("");
    console.info(`✅ No outdated links found amongst ${total} total, congrats!`);
    console.info("");
    return;
  }

  const outdated = Array.from(report.outdated.values()).reduce((a, b) => a + b.length, 0);
  const broken = [];
  console.info(`⌛ Outdated links ${outdated}/${total}`);
  for (const [path, links] of report.outdated) {
    console.info(`  📜 ${path}`);
    for (const link of links) {
      const ico = link.updated ? "🧹" : "🦖";
      const line = link.lineNumber.toString().padStart(3, " ");
      console.info(`    ${line}: ${ico} ${link.raw} (version: ${link.versionName})`);

      let isBroken = link.updated === undefined;
      if (link.updated) {
        if (link.isValidInLatest) {
          console.info("      Can be safely updated (but please check!):");
          console.info(`      👉 ${link.updated} (version: ${report.latestVersion})`);
        } else {
          console.info("      Is most likely broken:");
          console.info(`      ☠️  ${link.updated} (version: ${report.latestVersion}`);
          isBroken = true;
        }
      }
      if (isBroken) {
        broken.push({
          file: path,
          link,
        });
      }
    }
    console.info();
  }

  if (!broken.length) {
    console.info(`✅ No broken links found amongst ${total} total.`);
    if (outdated > 0) {
      console.info(`⚠️  Yet there are ${outdated} links. See above.`);
    }
  } else {
    console.info(`⁉️  Detected some potentially broken links ${broken.length}/${total}`);
    for (const { file, link } of broken) {
      const ico = link.updated ? "⚠️" : "🦖";
      console.info(`  ${ico} ${link.raw}`);
      console.info(`    at ${file}:${link.lineNumber}`);
      if (link.updated) {
        console.info(`    ☠️ ${link.updated}`);
      }
    }
  }
}

export function printFileReport(report: FileReport) {
  for (const l of report.allLinks) {
    console.info(`\t 🔗 ${l.raw}`);
  }
}
