import type { ISelectionParams } from "@fluffylabs/types";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CodeSyncContext, type ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";

const LOCAL_STORAGE_KEY = "notes-v2";
const LEGACY_NOTES_LS_KEY = "notes";
const HISTORY_STEPS_LIMIT = 10;

export const NotesContext = createContext<INotesContext | null>(null);

export interface INotesContext {
  notes: TAnyNote[];
  notesMigrated: TAnyNote[];
  canUndo: boolean;
  hasLegacyNotes: boolean;
  handleAddNote(note: TAnyNote): void;
  handleUpdateNote(noteToReplace: TAnyNote, newNote: TAnyNote): void;
  handleDeleteNote(note: TAnyNote): void;
  handleUndo(): void;
  handleImport(jsonStr: string): void;
  handleExport(): void;
  handleLegacyExport(): void;
}

export interface INote {
  content: string;
  date: number;
  author: string;
  pageNumber: number;
  version: string;
}

export interface IPointNote extends INote {
  left: number;
  top: number;
}

export interface IHighlightNote extends INote, ISelectionParams {
  selectionString: string;
}

export type TAnyNote = IPointNote | IHighlightNote;

interface INotesProviderProps {
  children: ReactNode;
}

function isINote(arg: unknown): arg is INote {
  if (typeof arg !== "object" || arg === null) return false;
  if (!("content" in arg) || typeof arg.content !== "string") return false;
  if (!("date" in arg) || typeof arg.date !== "number") return false;
  if (!("author" in arg) || typeof arg.author !== "string") return false;
  if (!("pageNumber" in arg) || typeof arg.pageNumber !== "number") return false;
  if (!("version" in arg) || typeof arg.version !== "string") return false;

  return true;
}

function isHighlightNote(arg: unknown): arg is IHighlightNote {
  if (!isINote(arg)) return false;
  if (!("selectionString" in arg) || typeof arg.selectionString !== "string") return false;
  if (!("selectionStart" in arg)) return false;
  if (!("selectionEnd" in arg)) return false;

  return true;
}

function parseJson(jsonStr: string): TAnyNote[] {
  try {
    const parsed = JSON.parse(jsonStr) as TAnyNote[];

    if (!Array.isArray(parsed)) {
      throw new Error("Notes JSON should be an array.");
    }

    if (!parsed.every(isINote)) {
      throw new Error("Invalid note format.");
    }

    return parsed;
  } catch (e) {
    console.error("Error loading notes.", e);
    return [];
  }
}

function loadFromLocalStorage(): TAnyNote[] {
  return parseJson(window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? "[]");
}

function loadLegacyFromLocalStorage(): string | null {
  return window.localStorage.getItem(LEGACY_NOTES_LS_KEY);
}

function saveToLocalStorage(notes: TAnyNote[]): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    alert(`Unable to save notes: ${e}`);
  }
}

export function NotesProvider({ children }: INotesProviderProps) {
  const [notes, setNotes] = useState<TAnyNote[]>(loadFromLocalStorage());
  const [notesMigrated, setNotesMigrated] = useState<TAnyNote[]>([]);
  const [history, setHistory] = useState<TAnyNote[][]>([]);
  const [hasLegacyNotes, setHasLegacyNotes] = useState<boolean>(false);
  const { locationParams } = useContext(LocationContext) as ILocationContext;
  const { migrateSelection } = useContext(CodeSyncContext) as ICodeSyncContext;

  const canUndo = useMemo(() => history.length > 0, [history]);

  const pushCurrentStateToHistory = useCallback(() => {
    setHistory((history) => [...history, notes].slice(-1 * HISTORY_STEPS_LIMIT));
  }, [notes]);

  useEffect(() => {
    saveToLocalStorage(notes);
  }, [notes]);

  useEffect(() => {
    const localStorageContent = loadLegacyFromLocalStorage();
    setHasLegacyNotes(!!localStorageContent && localStorageContent !== "[]");
  });

  useEffect(() => {
    async function preMigrateNotes() {
      setNotesMigrated(
        await Promise.all(
          notes.map(async (note) => {
            if (note.version === locationParams.version || !isHighlightNote(note)) {
              return note;
            }

            const newSelection = await migrateSelection(
              { selectionStart: note.selectionStart, selectionEnd: note.selectionEnd },
              note.version,
              locationParams.version,
            );

            if (!newSelection) {
              return { ...note };
            }

            return {
              ...note,
              version: locationParams.version,
              selectionStart: newSelection.selectionStart,
              selectionEnd: newSelection.selectionEnd,
              pageNumber: newSelection.selectionStart.pageNumber,
            };
          }),
        ),
      );
    }

    preMigrateNotes();
  }, [notes, locationParams.version, migrateSelection]);

  const context: INotesContext = {
    notes,
    notesMigrated,
    canUndo,
    hasLegacyNotes,
    handleAddNote: useCallback(
      (note) => {
        pushCurrentStateToHistory();
        setNotes((notes) => [...notes, note]);
      },
      [pushCurrentStateToHistory],
    ),
    handleUpdateNote: useCallback(
      (noteToReplace, newNote) => {
        pushCurrentStateToHistory();
        setNotes((notes) => notes.map((note) => (noteToReplace === note ? newNote : note)));
      },
      [pushCurrentStateToHistory],
    ),
    handleDeleteNote: useCallback(
      (noteToDelete) => {
        pushCurrentStateToHistory();
        setNotes((notes) => notes.filter((note) => note !== noteToDelete));
      },
      [pushCurrentStateToHistory],
    ),
    handleUndo: useCallback(() => {
      setNotes(history[history.length - 1]);
      setHistory((history) => history.slice(0, history.length - 1));
    }, [history]),
    handleImport(jsonStr) {
      const newNotes = parseJson(jsonStr);
      const overwrite = confirm(
        `Your current notes will be replaced with ${newNotes.length} notes loaded from the file. Continue?`,
      );
      if (overwrite) {
        setNotes(newNotes);
      }
    },
    handleExport() {
      const strNotes = JSON.stringify(notes);
      const link = document.createElement("a");
      link.setAttribute("href", `data:application/json;charset=utf-8,${encodeURIComponent(strNotes)}`);
      link.setAttribute("download", `graypaper-notes-${new Date().toISOString()}.json`);
      link.click();
    },
    handleLegacyExport() {
      const link = document.createElement("a");
      link.setAttribute("href", `data:application/json;charset=utf-8,${loadLegacyFromLocalStorage()}`);
      link.setAttribute("download", `old-graypaper-notes-${new Date().toISOString()}.json`);
      link.click();
    },
  };

  return <NotesContext.Provider value={context}>{children}</NotesContext.Provider>;
}
