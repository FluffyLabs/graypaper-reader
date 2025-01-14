import { LABEL_LOCAL } from "../consts/labels";
import type { INotesEnvelope } from "../types/StorageNote";
import { exportNotesAsJson, importNotesFromJson } from "./notesImportExport";

const LOCAL_STORAGE_KEY = "notes-v2";
const BACKUP_STORAGE_KEY = "notes-v2-backup";

export function loadFromLocalStorage(): INotesEnvelope {
  try {
    return importNotesFromJson(window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? "[]", LABEL_LOCAL);
  } catch (e) {
    console.error("Error loading notes from local storage!", e);
    return {
      version: 3,
      notes: [],
    };
  }
}

export function saveToLocalStorage(notes: INotesEnvelope): void {
  try {
    const prev = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    // make a backup just for safety.
    if (prev) {
      window.localStorage.setItem(BACKUP_STORAGE_KEY, prev);
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY, exportNotesAsJson(notes, false));
  } catch (e) {
    alert(`Unable to save notes: ${e}`);
  }
}
