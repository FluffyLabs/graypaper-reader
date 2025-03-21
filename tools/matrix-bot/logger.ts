import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fetchMetadata, findLinkToLatestVersion } from "@fluffylabs/links-metadata";
import { convertToNotes, saveNotes } from "./convert-to-notes";

export class MessagesLogger {
  constructor(
    private readonly roomId: string,
    private readonly notesLabels: string[],
  ) {}

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
    const notesOutputFilename = `output/notes-${majorVersion}.json`;

    const link = this.generatePermalink(eventId);
    const newMessage = {
      date,
      sender,
      link,
      msg,
    };

    let messages = [];
    // read previous log file
    try {
      messages = JSON.parse(readFileSync(path.resolve(outputFilename), "utf-8"));
    } catch (e) {}

    // append the new message and save.
    messages.push(newMessage);
    writeFileSync(outputFilename, JSON.stringify(messages));

    try {
      const notes = await convertToNotes(meta, outputFilename, this.notesLabels);
      saveNotes(notes, notesOutputFilename);
    } catch (e) {
      console.error(e);
    }
  }
}
