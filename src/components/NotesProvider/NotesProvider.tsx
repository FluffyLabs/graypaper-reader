import { type ReactNode, createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ISynctexBlockId } from "../CodeSyncProvider/CodeSyncProvider";

const LOCAL_STORAGE_KEY = "notes";
const HISTORY_STEPS_LIMIT = 10;

export const NotesContext = createContext<INotesContext | null>(null);

export interface INotesContext {
  notes: TAnyNote[];
  canUndo: boolean;
  handleAddNote(note: TAnyNote): void;
  handleUpdateNote(noteToReplace: TAnyNote, newNote: TAnyNote): void;
  handleDeleteNote(note: TAnyNote): void;
  handleUndo(): void;
  handleImport(jsonStr: string): void;
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

export interface IHighlightNote extends INote {
  selectionStart: ISynctexBlockId;
  selectionEnd: ISynctexBlockId;
  selectionString: string;
}

export type TAnyNote = IPointNote | IHighlightNote;

interface INotesProviderProps {
  children: ReactNode;
}

function isINote(arg: unknown): arg is INote {
  if (typeof arg !== "object" || arg === null) return false;
  if ("content" in arg && typeof arg.content !== "string") return false;
  if ("date" in arg && typeof arg.date !== "number") return false;
  if ("author" in arg && typeof arg.author !== "string") return false;
  if ("pageNumber" in arg && typeof arg.pageNumber !== "number") return false;
  if ("version" in arg && typeof arg.version !== "string") return false;

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

function saveToLocalStorage(notes: TAnyNote[]): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    alert(`Unable to save notes: ${e}`);
  }
}

export function NotesProvider({ children }: INotesProviderProps) {
  const [notes, setNotes] = useState<TAnyNote[]>(loadFromLocalStorage());
  const [history, setHistory] = useState<TAnyNote[][]>([]);

  const canUndo = useMemo(() => history.length > 0, [history]);

  const pushCurrentStateToHistory = useCallback(() => {
    setHistory((history) => [...history, notes].slice(-1 * HISTORY_STEPS_LIMIT));
  }, [notes]);

  useEffect(() => {
    saveToLocalStorage(notes);
  }, [notes]);

  const context: INotesContext = {
    notes,
    canUndo,
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
  };

  return <NotesContext.Provider value={context}>{children}</NotesContext.Provider>;
}
