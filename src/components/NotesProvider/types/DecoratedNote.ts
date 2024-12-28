import {ISelectionParams} from "@fluffylabs/types";
import {IStorageNote} from "./StorageNote";

// TODO [ToDr] move ISelectionParams to a prop
export type IDecoratedNote = ISelectionParams & {
  /** Unique id of the note. */
  id: string;
  original: IStorageNote;
  source: NoteSource;

  canBeMigrated: boolean;
  version: string;
};

export enum NoteSource {
  Local = 0,
  Remote = 1,
}
