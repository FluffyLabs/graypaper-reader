import fs from "node:fs";
import path from "node:path";
import type { INoteV3, INotesEnvelopeV3, Metadata } from "@fluffylabs/links-metadata";
import { fetchMetadata, findLinks, parseLink } from "@fluffylabs/links-metadata";

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

export async function convertToNotes(meta: Metadata, file: string, outputFile?: string) {
  const data = require(path.resolve(file)) as Message[];

  const notes = new Map<string, INoteV3>();
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
        noteVersion: 3,
        content,
        date,
        author: msg.sender,
        ...linkData,
        labels: [],
      });
    }
  }

  const notesArray = Array.from(notes.values());
  const envelope: INotesEnvelopeV3 = {
    version: 3,
    notes: notesArray,
  };
  if (outputFile) {
    fs.writeFileSync(path.resolve(outputFile), JSON.stringify(envelope, null, 2));
    console.info(`💾 Saved ${notesArray.length} notes to ${outputFile}.`);
  } else {
    console.info(JSON.stringify(envelope, null, 2));
  }
}

async function findAndParseLink(content: string, meta: Metadata) {
  const links = findLinks(content);
  if (!links[0]) {
    return null;
  }

  const linkData = parseLink(links[0], meta);
  if (linkData === null) {
    return null;
  }

  return {
    link: links[0],
    version: linkData.version,
    selectionStart: linkData.selectionStart,
    selectionEnd: linkData.selectionEnd,
  };
}

async function main(inputFilename: string, outputFilename: string) {
  const meta = await fetchMetadata();
  await convertToNotes(meta, inputFilename, outputFilename);
}

if (require.main === module) {
  main(process.argv[2], process.argv[3]);
}
