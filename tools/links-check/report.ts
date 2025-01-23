import type { Link } from "@fluffylabs/links-metadata";

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

export type Summary = {
  total: number;
  outdated: number;
  broken: number;
};

export function printReport(report: Report): Summary {
  const total = Array.from(report.detected.values()).reduce((a, b) => a + b.length, 0);
  if (!report.outdated.size) {
    console.info("");
    console.info(`✅ No outdated links found amongst ${total} total, congrats!`);
    console.info("");
    return {
      total,
      outdated: 0,
      broken: 0,
    };
  }

  const outdated = Array.from(report.outdated.values()).reduce((a, b) => a + b.length, 0);
  const broken: { file: Path; link: Link }[] = [];
  console.info(`⌛ Outdated links ${outdated}/${total}:`);
  console.info();
  for (const [path, links] of report.outdated) {
    console.info(`  📜 ${path}`);
    for (const link of links) {
      const ico = link.updated ? "🧹" : "🦖";
      const line = link.lineNumber.toString().padStart(3, " ");
      console.info(`    ${line}: ${ico} ${link.url} (version: ${link.versionName})`);

      let isBroken = link.updated === null;
      if (link.updated) {
        if (link.migrated) {
          console.info("      Can be migrated to (please check!):");
          console.info(`      👉 ${link.updated} (version: ${report.latestVersion})`);
        } else {
          console.info("      Is most likely broken:");
          console.info(`      ☠️  ${link.updated} (version: ${report.latestVersion})`);
          isBroken = true;
        }
      }
      console.info();
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
      console.info(`⚠️  Yet there are ${outdated} outdated links. See above.`);
      console.info(`⚠️  You can use '--fix' flag to automatically update these links with suggestions.`);
    }
  } else {
    console.info(`⁉️  Detected some potentially broken links ${broken.length}/${total}:`);
    console.info();
    for (const { file, link } of broken) {
      const ico = link.updated ? "⚠️" : "🦖";
      console.info(`  ${ico}  ${link.url}`);
      console.info(`    at ${file}:${link.lineNumber}`);
      if (link.updated) {
        console.info(`    ☠️  ${link.updated}`);
      }
      console.info();
    }

    if (outdated !== broken.length) {
      console.info(`⚠️  You can use '--fix' flag to automatically update outdated links. Broken links are not going to be changed.`);
    }
  }

  return {
    total,
    outdated,
    broken: broken.length,
  };
}

export function printFileReport(report: FileReport) {
  for (const l of report.allLinks) {
    console.info(`\t 🔗 ${l.url}`);
  }
}
