import type { ISelectionParams } from "@fluffylabs/types";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CodeSyncContext, type ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";

const LOCAL_STORAGE_KEY = "notes-v2";
const BACKUP_STORAGE_KEY = "notes-v2-backup";
const LEGACY_NOTES_LS_KEY = "notes";
const HISTORY_STEPS_LIMIT = 10;

export const LABEL_LOCAL = "local";

export const NotesContext = createContext<INotesContext | null>(null);

export interface INotesContext {
  notes: TAnyNote[];
  canUndo: boolean;
  hasLegacyNotes: boolean;
  handleAddNote(note: TAnyNote): void;
  handleUpdateNote(noteToReplace: TAnyNote, newNote: TAnyNote): void;
  handleDeleteNote(note: TAnyNote): void;
  handleUndo(): void;
  handleImport(jsonStr: string, label: string): void;
  handleExport(): void;
  handleLegacyExport(): void;
}

export enum NoteSource {
  Local = 0,
  Imported = 1,
  Remote = 2,
}

interface INoteV2 {
  content: string;
  date: number;
  author: string;
  pageNumber: number;
  version: string;
  canMigrateTo?: {
    version: string;
    pageNumber: number;
  };
}

interface INoteV3 extends INoteV2 {
  labels: string[];
  source: NoteSource;
}

export interface IPointNote extends INoteV3 {
  left: number;
  top: number;
}

export interface IHighlightNote extends INoteV3, ISelectionParams {
  selectionString: string;
  canMigrateTo?: {
    version: string;
    pageNumber: number;
  } & ISelectionParams;
}

export type TAnyNote = IPointNote | IHighlightNote;

interface INotesProviderProps {
  children: ReactNode;
}

function isINoteV2(arg: unknown): arg is INoteV2 {
  if (typeof arg !== "object" || arg === null) return false;
  if (!("content" in arg) || typeof arg.content !== "string") return false;
  if (!("date" in arg) || typeof arg.date !== "number") return false;
  if (!("author" in arg) || typeof arg.author !== "string") return false;
  if (!("pageNumber" in arg) || typeof arg.pageNumber !== "number") return false;
  if (!("version" in arg) || typeof arg.version !== "string") return false;

  return true;
}

function isINoteV3(arg: unknown): arg is INoteV3 {
  if (!isINoteV2(arg)) {
    return false;
  }

  if (!("labels" in arg && Array.isArray(arg.labels))) {
    return false;
  }

  if (!("source" in arg && Array.isArray(arg.source))) {
    return false;
  }

  return true;
}

function isHighlightNote(arg: unknown): arg is IHighlightNote {
  if (!isINoteV3(arg)) return false;
  if (!("selectionString" in arg) || typeof arg.selectionString !== "string") return false;
  if (!("selectionStart" in arg)) return false;
  if (!("selectionEnd" in arg)) return false;

  return true;
}

function parseJson(jsonStr: string): INoteV2[] {
  try {
    const parsed = JSON.parse(jsonStr) as INoteV2[];

    if (!Array.isArray(parsed)) {
      throw new Error("Notes JSON should be an array.");
    }

    if (!parsed.every(isINoteV2)) {
      throw new Error("Invalid note format.");
    }

    return parsed;
  } catch (e) {
    console.error("Error loading notes.", e);
    return [];
  }
}

function convertNoteV2toV3(noteV2: INoteV2, label: string): INoteV3 {
  const note = noteV2 as INoteV3;
  if (!Array.isArray(note.labels)) {
    note.labels = [];
  }

  if (note.labels.indexOf(label) === -1) {
    note.labels.unshift(label);
  }

  if (note.source === undefined) {
    note.source = NoteSource.Local;
  }

  note.canMigrateTo = undefined;
  return note;
}

function loadFromLocalStorage(): TAnyNote[] {
  const notes = parseJson(window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? "[]");
  return notes.map((note) => convertNoteV2toV3(note, LABEL_LOCAL) as TAnyNote);
}

function loadLegacyFromLocalStorage(): string | null {
  return window.localStorage.getItem(LEGACY_NOTES_LS_KEY);
}

function saveToLocalStorage(notes: TAnyNote[]): void {
  try {
    const prev = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    // make a backup just for safety.
    if (prev) {
      window.localStorage.setItem(BACKUP_STORAGE_KEY, prev);
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    alert(`Unable to save notes: ${e}`);
  }
}

export function NotesProvider({ children }: INotesProviderProps) {
  const [localNotes, setLocalNotes] = useState<TAnyNote[]>(loadFromLocalStorage());
  const [localNotesMigrated, setLocalNotesMigrated] = useState<TAnyNote[]>([]);
  const [history, setHistory] = useState<TAnyNote[][]>([]);
  const [hasLegacyNotes, setHasLegacyNotes] = useState<boolean>(false);
  const { locationParams } = useContext(LocationContext) as ILocationContext;
  const { migrateSelection } = useContext(CodeSyncContext) as ICodeSyncContext;

  const canUndo = useMemo(() => history.length > 0, [history]);

  const updateLocalNotes = useCallback((localNotes: TAnyNote[]) => {
    setHistory((history) => [...history, localNotes].slice(-1 * HISTORY_STEPS_LIMIT));
    setLocalNotes(localNotes);
    saveToLocalStorage(localNotes);
  }, []);

  useEffect(() => {
    const localStorageContent = loadLegacyFromLocalStorage();
    setHasLegacyNotes(!!localStorageContent && localStorageContent !== "[]");
  });

  useEffect(() => {
    async function preMigrateNotes() {
      setLocalNotesMigrated(
        await Promise.all(
          localNotes.map(async (note) => {
            // TODO [ToDr] We can potentially cache that by re-using the migrations
            // that were already done.
            if (note.version === locationParams.version || !isHighlightNote(note)) {
              return note;
            }

            const newSelection = await migrateSelection(
              { selectionStart: note.selectionStart, selectionEnd: note.selectionEnd },
              note.version,
              locationParams.version,
            );

            if (!newSelection) {
              return note;
            }

            return {
              ...note,
              canMigrateTo: {
                version: locationParams.version,
                selectionStart: newSelection.selectionStart,
                selectionEnd: newSelection.selectionEnd,
                pageNumber: newSelection.selectionStart.pageNumber,
              },
            };
          }),
        ),
      );
    }

    preMigrateNotes();
  }, [localNotes, locationParams.version, migrateSelection]);

  const context: INotesContext = {
    notes: localNotesMigrated,
    canUndo,
    hasLegacyNotes,
    handleAddNote: useCallback((note) => updateLocalNotes([...localNotes, note]), [localNotes, updateLocalNotes]),
    handleUpdateNote: useCallback(
      (noteToReplace, newNote) => {
        if (noteToReplace.source !== NoteSource.Local) {
          console.warn("Refusing to edit remote note.", noteToReplace);
          return;
        }
        const updateIdx = localNotesMigrated.indexOf(noteToReplace);
        const newNotes = localNotes.map((note, idx) => (updateIdx === idx ? newNote : note));
        updateLocalNotes(newNotes);
      },
      [localNotes, localNotesMigrated, updateLocalNotes],
    ),
    handleDeleteNote: useCallback(
      (noteToDelete) => {
        if (noteToDelete.source === NoteSource.Remote) {
          console.warn("Refusing to remove remote note.", noteToDelete);
          return;
        }
        const noteToDeleteIdx = localNotesMigrated.indexOf(noteToDelete);
        if (noteToDeleteIdx !== -1) {
          localNotes.splice(noteToDeleteIdx, 1);
          updateLocalNotes([...localNotes]);
        }
      },
      [localNotes, localNotesMigrated, updateLocalNotes],
    ),
    handleUndo: useCallback(() => {
      const newNotes = history.pop();
      if (!newNotes) {
        return;
      }

      setLocalNotes(newNotes);
      saveToLocalStorage(newNotes);
      setHistory([...history]);
    }, [history]),
    handleImport: useCallback(
      (jsonStr: string, label: string) => {
        let newNotes = [];
        try {
          newNotes = parseJson(jsonStr);
        } catch (e) {
          alert("Unable to read given notes file. See console for error.");
          console.error(e);
          return;
        }

        // merge notes together
        const notes = newNotes.map((note) => {
          const n = convertNoteV2toV3(note, `imported:${label}`);
          n.source = NoteSource.Imported;
          return n as TAnyNote;
        });

        updateLocalNotes([...localNotes, ...notes]);
      },
      [localNotes, updateLocalNotes],
    ),
    handleExport() {
      const strNotes = JSON.stringify(localNotes);
      const fileName = `graypaper-notes-${new Date().toISOString()}.json`;
      downloadNotes(strNotes, fileName);
    },
    handleLegacyExport() {
      const strNotes = loadLegacyFromLocalStorage() ?? "[]";
      const fileName = `old-graypaper-notes-${new Date().toISOString()}.json`;
      downloadNotes(strNotes, fileName);
    },
  };

  return <NotesContext.Provider value={context}>{children}</NotesContext.Provider>;
}

function downloadNotes(strNotes: string, fileName: string) {
  const link = document.createElement("a");
  link.setAttribute("href", `data:application/json;charset=utf-8,${encodeURIComponent(strNotes)}`);
  link.setAttribute("download", fileName);
  link.click();
}
