export type Path = string;
export type Link = {
  raw: string;
  version: string;
  blocks: string;
};

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

  console.info('⌛ Outdated links: ');
  for (const [path, links] of report.outdated) {
    console.info(path);
    for (const link of links) {
      console.info(`\t${link.raw}`);
    }
  }
}

export function printFileReport(report: FileReport) {
  for (const l of report.allLinks) {
    console.info(`\t 🔗 ${l.raw}`);
  }
}
