import type { INoteV3, INotesEnvelopeV3, Link } from "@fluffylabs/links-metadata";
import type { Report } from "./report";

export function generateNotes(report: Report, label?: string): INotesEnvelopeV3 {
  const perLink = new Map<string, { file: string; link: Link }[]>();
  const commonPath: Map<string, number>[] = [];

  for (const [file, links] of report.detected) {
    const parts = file.split("/");
    for (let i = 0; i < parts.length; i++) {
      commonPath[i] = commonPath[i] || new Map();
      commonPath[i].set(parts[i], (commonPath[i].get(parts[i]) || 0) + 1);
    }

    for (const link of links) {
      // consolidate urls to the newest version
      const url = link.updated || link.url;
      const list = perLink.get(url) ?? [];
      list.push({
        file,
        link,
      });
      perLink.set(url, list);
    }
  }

  const noOfFiles = report.detected.size;
  const path = commonPath
    .map((x) => {
      for (const [k, count] of x.entries()) {
        if (count === noOfFiles) {
          return k;
        }
        return null;
      }
    })
    .filter((x) => x)
    .join("/");

  const notes = [];
  for (const [_, linkData] of perLink) {
    const note = linkToNote(linkData, path);
    if (label) {
      note.labels.push(label);
    }
    notes.push(note);
  }

  return {
    version: 3,
    notes,
  };
}

function linkToNote(linkData: { file: string; link: Link }[], path: string): INoteV3 {
  const { link } = linkData[0];
  // if we knew the github repository address this could actually be links to browse the files.
  const content = linkData.map((x) => `${x.file.replace(path, "")}:${x.link.lineNumber}`).join("\n");

  return {
    noteVersion: 3,
    content,
    date: Date.now(),
    author: "",
    version: link.version,
    labels: [],
    selectionStart: link.selectionStart,
    selectionEnd: link.selectionEnd,
  };
}
