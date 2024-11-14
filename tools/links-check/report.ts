import {Link} from "./metadata";

export type Path = string;

export type FileReport = {
  allLinks: Link[],
  outdated: Link[],
};

export type Report = {
  detected: Map<Path, Link[]>,
  outdated: Map<Path, Link[]>,
  failed: Map<Path, string>,
};


export function printReport(report: Report) {
  const total = Array.from(report.detected.values()).reduce((a, b) => a + b.length, 0);
  if (!report.outdated.size) {
    console.info('');
    console.info(`✅ No outdated links found amongst ${total} total, congrats!`);
    console.info('');
    return;
  }

  const outdated = Array.from(report.outdated.values()).reduce((a, b) => a + b.length, 0);
  console.info(`⌛ Outdated links ${outdated}/${total}`);
  for (const [path, links] of report.outdated) {
    console.info(`  📜 ${path}`);
    for (const link of links) {
      const ico = link.updated ? '🧹': '👴';
      console.info(`    ${ico} ${link.raw}`);
      if (link.updated) {
        console.info(`      Might be replaced with (but please check!)`);
        console.info(`      👉 ${link.updated}`);
      }
    }
    console.info();
  }

  const potentiallyBroken = Array.from(report.outdated.values()).reduce((a, b) => {
    return [...b.filter(v => !v.isValid)];
  }, []);
  if (potentiallyBroken.length) {
    console.info('⁉️  Detected some potentially broken links:');
    for (const broken of potentiallyBroken) {
      console.info(`\t${broken.raw}`);
    }
  }
}

export function printFileReport(report: FileReport) {
  for (const l of report.allLinks) {
    console.info(`\t 🔗 ${l.raw}`);
  }
}
