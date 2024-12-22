import fs from "node:fs";
import path from "node:path";
import type { ISynctexBlockId, Metadata } from "@fluffylabs/links-metadata";
import { fetchMetadata, findLink, parseLink } from "@fluffylabs/links-metadata";

/**
 * Convert messages.json file generated by the tool into Reader notes format
 * so it can be imported or loaded as remote content.
 */

type Message = {
  /** ISO date. */
  date: string;
  /** Matrix handle */
  sender: string;
  /** Link to matrix message. */
  link: string;
  /** Content of the message. */
  msg: string;
};

type NoteV3 = {
  content: string;
  /** local-tz timestamp (from Date.now()) */
  date: number;
  /** empty for local notes. */
  author: string;
  /** duplicated in selectionStart/selectionEnd? */
  pageNumber: number;
  /** Full version number. */
  version: string;
  /** Labels. */
  labels: string[];

  /** selection */
  selectionString: string;
  selectionStart: ISynctexBlockId;
  selectionEnd: ISynctexBlockId;
};

async function main(file = "./output/messages.json") {
  const content = fs.readFileSync(path.resolve(file), "utf-8");
  // note that the file is not a valid JSON as-is (it's appended to),
  // so let's convert it to an array.
  const json = `[${content.substring(0, content.lastIndexOf("},"))}}]`;
  const data = JSON.parse(json) as Message[];

  // get metadata and synctex data.
  const meta = await fetchMetadata();

  const notes = new Map<string, NoteV3>();
  for (const msg of data) {
    const linkData = await findAndParseLink(msg.msg, meta);
    if (linkData === null) {
      continue;
    }

    const date = new Date(msg.date).getTime();
    const content = `${msg.link}\n\n---\n${msg.msg}`;
    // if we already have note for this link, ammend it.
    const prevNote = notes.get(linkData.link);
    if (prevNote) {
      // update date
      prevNote.date = date;
      // add another author
      prevNote.author += `, ${msg.sender}`;
      // add content
      prevNote.content = `${content}\n---\n${prevNote.content}`;
    } else {
      notes.set(linkData.link, {
        content,
        date,
        author: msg.sender,
        ...linkData,
        labels: [],
      });
    }
  }

  const notesArray = Array.from(notes.values());
  console.info(JSON.stringify(notesArray, null, 2));
}

async function findAndParseLink(content: string, meta: Metadata) {
  const link = findLink(content);
  if (link === null) {
    return null;
  }

  const linkData = parseLink(link, meta);
  if (linkData === null) {
    return null;
  }

  return {
    link,
    version: linkData.version,
    pageNumber: linkData.selectionStart.pageNumber,
    // TODO [ToDr] do I need to fill it up?
    selectionString: "",
    selectionStart: linkData.selectionStart,
    selectionEnd: linkData.selectionEnd,
  };
}

main(process.argv[2]);
