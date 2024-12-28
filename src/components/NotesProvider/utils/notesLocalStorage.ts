import {LABEL_LOCAL} from "../consts/labels";
import {INotesEnvelope} from "../types/StorageNote";
import {exportNotesAsJson, importNotesFromJson} from "./notesImportExport";

const LOCAL_STORAGE_KEY = "notes-v2";
const BACKUP_STORAGE_KEY = "notes-v2-backup";
const LEGACY_NOTES_LS_KEY = "notes";

export function loadFromLocalStorage(): INotesEnvelope {
  return importNotesFromJson(window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? "[]", LABEL_LOCAL);
}

export function loadLegacyFromLocalStorage(): string | null {
  return window.localStorage.getItem(LEGACY_NOTES_LS_KEY);
}

export function saveToLocalStorage(notes: INotesEnvelope): void {
  try {
    const prev = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    // make a backup just for safety.
    if (prev) {
      window.localStorage.setItem(BACKUP_STORAGE_KEY, prev);
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY, exportNotesAsJson(notes));
  } catch (e) {
    alert(`Unable to save notes: ${e}`);
  }
}
