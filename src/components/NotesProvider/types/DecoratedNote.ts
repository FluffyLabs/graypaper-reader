import type { ISelectionParams } from "@fluffylabs/types";
import type { IStorageNote } from "./StorageNote";

// TODO [ToDr] move ISelectionParams to a prop
export type IDecoratedNote = ISelectionParams & {
  key: string;
  original: IStorageNote;
  source: NoteSource;

  canBeMigrated: boolean;
  version: string;
};

export enum NoteSource {
  Local = 0,
  Remote = 1,
}
