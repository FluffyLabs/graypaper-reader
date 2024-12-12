import fs from "node:fs";
import { SynctexStore, TexStore } from "@fluffylabs/synctex-store";
import type { ISynctexData } from "../../packages/types";
import { parseLink } from "./link";
import { type Metadata, ORIGIN, synctexUrlGetter, texUrlGetter } from "./metadata";
import { type FileReport, type Path, type Report, printFileReport } from "./report";

class Timer {
  data = new Map();

  start(label: string) {
    this.data.set(label, performance.now());
  }

  end(label: string, display = true) {
    const now = performance.now();
    const val = this.data.get(label);
    this.data.delete(label);

    if (val && display) {
      const took = now - val;
      console.info(`⏱️ ${took.toFixed(2)}ms: ${label}`);
    }
  }
}

export async function scan(files: Path[], metadata: Metadata, commonPath: string): Promise<Report> {
  const timer = new Timer();
  const synctexCache = new Map<string, Promise<ISynctexData>>();
  const synctexStore = new SynctexStore(synctexUrlGetter, synctexCache);
  const texCache = new Map<string, Promise<string>>();
  const texStore = new TexStore(texUrlGetter, texCache);
  const results = await Promise.allSettled(
    files.map(async (file) => {
      const shortFileName = file.replace(commonPath, "");
      timer.start(shortFileName);
      const fileReport = await scanFile(file, metadata, synctexStore, texStore);
      timer.end(shortFileName, fileReport.allLinks.length > 0);
      printFileReport(fileReport);
      console.info();
      return fileReport;
    }),
  );

  const report = {
    latestVersion: metadata.metadata.versions[metadata.metadata.latest]?.name || metadata.latestShort,
    detected: new Map(),
    outdated: new Map(),
    failed: new Map(),
  };

  for (const [idx, r] of results.entries()) {
    const f = files[idx].replace(commonPath, "");
    if (r.status === "rejected") {
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

async function scanFile(
  path: Path,
  metadata: Metadata,
  synctexStore: SynctexStore,
  texStore: TexStore,
): Promise<FileReport> {
  const links: [number, string][] = [];
  const report: FileReport = {
    allLinks: [],
    outdated: [],
  };

  await readLineByLine(path, (lineNumber, line) => {
    const linkStart = line.indexOf(ORIGIN);
    if (linkStart !== -1) {
      // extract raw link
      const linkLine = line.substring(linkStart);
      const whitespaceIdx = linkLine.indexOf(" ");
      const link = whitespaceIdx !== -1 ? linkLine.substring(0, whitespaceIdx) : linkLine;

      links.push([lineNumber, link]);
    }
  });

  const linksParsed = await Promise.all(
    links.map(([lineNumber, link]) => parseLink(lineNumber, link, metadata, synctexStore, texStore)),
  );

  report.allLinks = linksParsed;
  report.outdated = linksParsed.filter((l) => l.isOutdated);

  return Promise.resolve(report);
}

function readLineByLine(path: Path, cb: (no: number, line: string) => void): Promise<void> {
  const BUFFER_SIZE = 4_096;
  const stream = fs.createReadStream(path, { encoding: "utf8" });
  return new Promise((resolve, reject) => {
    let previousData = "";
    let lineNumber = 1;
    stream.on("readable", () => {
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
        const lines = previousData.split("\n");
        for (let i = 0; i < lines.length - 1; i += 1) {
          cb(lineNumber, lines[i]);
          lineNumber += 1;
        }
        // we can't be sure if the last line is complete or not
        previousData = lines.length > 0 ? lines[lines.length - 1] : "";
      } while (chunk !== null);
    });

    stream.on("error", reject);
    stream.on("end", () => {
      // there might be still sometihng in the buffer:
      if (previousData.length) {
        cb(lineNumber, previousData);
      }
      resolve();
    });
  });
}

export function getCommonPath(files: Path[]) {
  let common = files[0];
  for (const f of files) {
    const len = Math.min(f.length, common.length);
    for (let i = 0; i < len; i += 1) {
      if (common.charAt(i) !== f.charAt(i)) {
        common = common.substring(0, i);
        break;
      }
    }
  }
  return common;
}
