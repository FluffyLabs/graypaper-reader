import fs from 'node:fs';
import { Path, Report, FileReport, printFileReport } from './report';

class Timer {
  data = new Map();

  start(label: string) {
    this.data.set(label, performance.now());
  }

  end(label: string, display: boolean = true) {
    const now = performance.now();
    const val = this.data.get(label);
    this.data.delete(label);

    if (val && display) {
      const took = now - val;
      console.info(`⏱️ ${took.toFixed(2)}ms: ${label}`);
    }
  }
}

export async function scan(files: Path[]): Promise<Report> {
  const timer = new Timer();
  const results = await Promise.allSettled(files.map(async (file) => {
    timer.start(file);
    const fileReport = await scanFile(file);
    timer.end(file, fileReport.allLinks.length > 0);
    printFileReport(fileReport);
    return fileReport;
  }));

  const report = {
    detected: new Map(),
    outdated: new Map(),
    failed: new Map(),
  };

  for (const [idx, r] of results.entries()) {
    const f = files[idx];
    if (r.status === 'rejected') {
      report.failed.set(f, r.reason);
    } else {
      if (r.value.allLinks.length) {
        report.detected.set(f, r.value.allLinks);
      }
      if (r.value.outdated.length) {
        report.outdated.set(f, r.value.outdated);
      }
    }
  }

  return Promise.resolve(report);
}


async function scanFile(path: Path): Promise<FileReport> {
  const report: FileReport = {
    allLinks: [],
    outdated: [],
  };

  await readLineByLine(path, (line) => {
    const linkStart = line.indexOf("https://graypaper.fluffylabs.dev");
    if (linkStart !== -1) {
      // extract raw link
      const linkLine = line.substring(linkStart);
      const whitespaceIdx = linkLine.indexOf(' ');
      const link = whitespaceIdx !== -1 ? linkLine.substring(0, whitespaceIdx) : linkLine;
      // attempt to parse version and blocks.

      report.allLinks.push({
        raw: link,
        version: '',
        blocks: ''
      });
    }
  });

  return Promise.resolve(report);
}

function readLineByLine(path: Path, cb: (line: string) => void): Promise<void> {
  const BUFFER_SIZE = 4_096;
  const stream = fs.createReadStream(path, { encoding: 'utf8' });
  return new Promise((resolve, reject) => {
    let previousData: string = '';
    stream.on('readable', () => {
      let chunk = null;
      do {
        try {
          chunk = stream.read(BUFFER_SIZE);
        } catch (e) {
          // console.warn(`Error while reading stream of ${path}: ${e}`);
          chunk = null;
          reject(e);
        }
        if (chunk) {
          previousData += chunk;
        }
        const lines = previousData.split('\n');
        for (let i = 0; i < lines.length - 1; i += 1) {
          cb(lines[i]);
        }
        // we can't be sure if the last line is complete or not
        previousData = lines.length > 0 ? lines[lines.length - 1] : '';
      } while(chunk !== null);
    });

    stream.on('error', reject);
    stream.on('end', () => {
      // there might be still sometihng in the buffer:
      if (previousData.length) {
        cb(previousData);
      }
      resolve();
    });
  });
}
