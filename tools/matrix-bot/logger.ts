import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fetchMetadata, findLinkToLatestVersion } from "@fluffylabs/links-metadata";
import { convertToNotes } from "./convert-to-notes";

export class MessagesLogger {
  constructor(private readonly roomId: string) {}

  private generatePermalink(eventId: string): string {
    return `https://matrix.to/#/${this.roomId}/${eventId}`;
  }

  async onMessage(msg: string, sender: string | undefined, eventId: string | undefined, date: Date | null) {
    if (!eventId) {
      return;
    }

    const meta = await fetchMetadata();

    // if there are several links in the message, find the link with the latest version
    const versionName = findLinkToLatestVersion(msg, meta)?.versionName;

    if (!versionName) {
      return;
    }

    const majorVersion = `${versionName.split(".").slice(0, 2).join(".")}.x`;
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
      convertToNotes(meta, outputFilename, notesFilename);
    } catch (e) {
      console.error(e);
    }
  }
}
