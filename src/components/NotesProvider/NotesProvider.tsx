import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ISynctexBlock } from "../CodeSyncProvider/CodeSyncProvider";

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
}

export interface INote {
  content: string;
  date: number;
  author: string;
  pageNumber: number;
}

export interface IPointNote extends INote {
  left: number;
  top: number;
}

export interface IHighlightNote extends INote {
  blocks: ISynctexBlock[];
}

export type TAnyNote = IPointNote | IHighlightNote;

interface INotesProviderProps {
  children: ReactNode;
}

function loadFromLocalStorage(): TAnyNote[] {
  try {
    const notes = window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? "[]";
    const parsed = JSON.parse(notes) as TAnyNote[];

    if (!Array.isArray(parsed)) {
      throw new Error(`'${LOCAL_STORAGE_KEY}' in local storage should be an array.`);
    }

    return parsed;
  } catch (e) {
    console.warn("Error loading notes from local storage.", e);
    return [];
  }
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

  const canUndo = useMemo(() => history.length < 0, [history]);

  const pushCurrentStateToHistory = useCallback(() => {
    setHistory((history) => [...history, notes].slice(-1 * HISTORY_STEPS_LIMIT));
  }, [notes]);

  const handleAddNote = useCallback(
    (note: TAnyNote) => {
      pushCurrentStateToHistory();
      setNotes((notes) => [...notes, note]);
    },
    [pushCurrentStateToHistory]
  );

  const handleUpdateNote = useCallback(
    (noteToReplace: TAnyNote, newNote: TAnyNote) => {
      pushCurrentStateToHistory();
      setNotes((notes) => notes.map((note) => (noteToReplace === note ? newNote : note)));
    },
    [pushCurrentStateToHistory]
  );

  const handleDeleteNote = useCallback(
    (noteToDelete: TAnyNote) => {
      pushCurrentStateToHistory();
      setNotes((notes) => notes.filter((note) => note !== noteToDelete));
    },
    [pushCurrentStateToHistory]
  );

  const handleUndo = useCallback(() => {
    setNotes(history[history.length - 1]);
    setHistory((history) => history.slice(0, history.length - 2));
  }, [history]);

  useEffect(() => {
    saveToLocalStorage(notes);
  }, [notes]);

  const context: INotesContext = {
    notes,
    canUndo,
    handleAddNote,
    handleUpdateNote,
    handleDeleteNote,
    handleUndo,
  };

  return <NotesContext.Provider value={context}>{children}</NotesContext.Provider>;
}
