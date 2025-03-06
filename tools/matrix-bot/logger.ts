import { writeFileSync } from "node:fs";
import path from "node:path";
import { type Metadata, findLinks, parseLink } from "@fluffylabs/links-metadata";
import { convertToNotes } from "./convert-to-notes";

export class MessagesLogger {
  constructor(
    private readonly roomId: string,
    private readonly meta: Metadata,
  ) {}

  private generatePermalink(eventId: string): string {
    return `https://matrix.to/#/${this.roomId}/${eventId}`;
  }

  onMessage(msg: string, sender: string | undefined, eventId: string | undefined, date: Date | null) {
    if (!eventId) {
      return;
    }
    const gpLinks = findLinks(msg);
    if (!gpLinks.length) {
      return;
    }

    // if there are several links in the message, find the link with the latest version
    let versionName: string | undefined;

    if (gpLinks.length === 1) {
      versionName = parseLink(gpLinks[0], this.meta)?.versionName;
    } else {
      versionName = gpLinks
        .map((link) => parseLink(link, this.meta))
        .filter(Boolean)
        .map((link) => link?.versionName)
        .sort()
        .pop();
    }

    if (!versionName) {
      return;
    }

    const majorVersion = versionName.replace(/^(\d+\.\d+\.)\d+$/, "$1x");
    const outputFilename = `output/messages-${majorVersion}.json`;

    const link = this.generatePermalink(eventId);
    const json = JSON.stringify({
      date,
      sender,
      link,
      msg,
    });

    try {
      const messages = require(path.resolve(outputFilename));
      messages.push(JSON.parse(json));
      writeFileSync(outputFilename, JSON.stringify(messages));
    } catch (e) {
      writeFileSync(outputFilename, JSON.stringify([JSON.parse(json)]));
    }

    const notesFilename = `output/notes-${majorVersion}.json`;
    convertToNotes(this.meta, outputFilename, notesFilename);
  }
}
