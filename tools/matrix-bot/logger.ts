import { readFileSync, writeFileSync } from "node:fs";
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
        .map((link) => {
          const version = link?.versionName || "";
          const sortKey = version
            .split(".")
            .map((num) => num.padStart(3, "0"))
            .join("");
          return { version, sortKey };
        })
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .pop()?.version;
    }

    if (!versionName) {
      return;
    }

    const majorVersion = versionName.replace(/^(\d+\.\d+\.)\d+$/, "$1x");
    const outputFilename = `output/messages-${majorVersion}.json`;

    const link = this.generatePermalink(eventId);
    const newMessage = {
      date,
      sender,
      link,
      msg,
    };

    let messages = [];
    try {
      messages = JSON.parse(readFileSync(path.resolve(outputFilename), "utf-8"));
    } catch (e) {}
    messages.push(newMessage);
    writeFileSync(outputFilename, JSON.stringify(messages));

    const notesFilename = `output/notes-${majorVersion}.json`;
    try {
      convertToNotes(this.meta, outputFilename, notesFilename);
    } catch (e) {
      console.error(e);
    }
  }
}
