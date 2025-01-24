import type { ISelectionParams } from "./types";

/** Notes envelope. */
export interface INotesEnvelopeV3 {
  version: 3;
  notes: INoteV3[];
}

/** Version 3 of the note format. */
export interface INoteV3 extends ISelectionParams {
  /** Constant value for this version of the note. */
  noteVersion: 3;
  content: string;
  /** local-tz timestamp (from Date.now()) */
  date: number;
  /** empty for local notes. */
  author: string;
  /** Full version number. */
  version: string;
  /** Labels. */
  labels: string[];
}
