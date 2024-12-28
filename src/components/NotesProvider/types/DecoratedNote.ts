import type { ISelectionParams } from "@fluffylabs/types";
import type { IStorageNote } from "./StorageNote";

export type IDecoratedNote = {
  /** Key to be used when displaying react collection. */
  key: string;
  /** Source of the note. */
  source: NoteSource;
  /** Original note, as stored in LocalStorage or fetched from remote source. */
  original: IStorageNote;
  /** Synctex data migrated to current version (or original data if migration is not possible). */
  current: ISelectionParams & {
    canBeMigrated: boolean;
    version: string;
  };
};

export enum NoteSource {
  Local = 0,
  Remote = 1,
}