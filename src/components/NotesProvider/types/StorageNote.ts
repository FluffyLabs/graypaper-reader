import type { ISelectionParams } from "@fluffylabs/links-metadata";

/** Latest version of the stored note. */
export type IStorageNote = INoteV3;

/** Notes envelope. */
export interface INotesEnvelope {
  version: 3;
  notes: INoteV3[];
}

/** Version 3 of the note format. */
export interface INoteV3 extends ISelectionParams {
  noteVersion: 3;
  content: string;
  date: number;
  author: string;
  version: string;
  labels: string[];
}
