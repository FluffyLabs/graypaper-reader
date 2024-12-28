import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { LABEL_IMPORTED } from "./consts/labels";
import { useDecoratedNotes } from "./hooks/useDecoratedNotes";
import { type ILabel, useLabels } from "./hooks/useLabels";
import { useRemoteNotes } from "./hooks/useRemoteNotes";
import { type IDecoratedNote, NoteSource } from "./types/DecoratedNote";
import type { INotesEnvelope, IStorageNote } from "./types/StorageNote";
import { downloadJsonFile, downloadNotesAsJson, importNotesFromJson } from "./utils/notesImportExport";
import { loadFromLocalStorage, loadLegacyFromLocalStorage, saveToLocalStorage } from "./utils/notesLocalStorage";

const HISTORY_STEPS_LIMIT = 10;

export const NotesContext = createContext<INotesContext | null>(null);

export interface INotesContext {
  notes: IDecoratedNote[];
  labels: ILabel[];
  canUndo: boolean;
  hasLegacyNotes: boolean;
  handleAddNote(note: IStorageNote): void;
  handleUpdateNote(noteToReplace: IDecoratedNote, newNote: IStorageNote): void;
  handleDeleteNote(note: IDecoratedNote): void;
  handleUndo(): void;
  handleImport(jsonStr: string, label: string): void;
  handleExport(): void;
  handleLegacyExport(): void;
  handleToggleLabel(label: string): void;
}

interface INotesProviderProps {
  children: ReactNode;
}

export function NotesProvider({ children }: INotesProviderProps) {
  const [localNotes, setLocalNotes] = useState<INotesEnvelope>(loadFromLocalStorage());
  const [localNotesDecorated, setLocalNotesDecorated] = useState<IDecoratedNote[]>([]);
  const [history, setHistory] = useState<INotesEnvelope[]>([]);
  const { locationParams } = useContext(LocationContext) as ILocationContext;

  const currentVersion = locationParams.version;
  const canUndo = history.length > 0;

  const decorateNotes = useDecoratedNotes();
  const remoteNotesDecorated = useRemoteNotes(decorateNotes, currentVersion);

  // Legacy notes export indicator
  const hasLegacyNotes = useMemo(() => {
    const localStorageContent = loadLegacyFromLocalStorage();
    return !!localStorageContent && localStorageContent !== "[]";
  }, []);

  // Set in-state local notes, but also update history and local storage.
  const updateLocalNotes = useCallback((currentNotes: INotesEnvelope, newNotes: INotesEnvelope) => {
    setHistory((history) => [...history, currentNotes].slice(-1 * HISTORY_STEPS_LIMIT));
    setLocalNotes(newNotes);
    saveToLocalStorage(newNotes);
  }, []);

  // Decorate all local notes.
  useEffect(() => {
    decorateNotes(localNotes.notes, NoteSource.Local, currentVersion).then((notes) => {
      setLocalNotesDecorated(notes);
    });
  }, [localNotes.notes, currentVersion, decorateNotes]);

  // Local and remote notes merged together.
  const allNotes = useMemo(
    () => [...localNotesDecorated, ...remoteNotesDecorated],
    [localNotesDecorated, remoteNotesDecorated],
  );

  const [filteredNotes, labels, handleToggleLabel] = useLabels(allNotes);

  const context: INotesContext = {
    notes: filteredNotes,
    labels,
    canUndo,
    hasLegacyNotes,
    handleToggleLabel,
    handleAddNote: useCallback(
      (note) =>
        updateLocalNotes(localNotes, {
          ...localNotes,
          notes: [note, ...localNotes.notes],
        }),
      [localNotes, updateLocalNotes],
    ),
    handleUpdateNote: useCallback(
      (noteToReplace, newNote) => {
        if (noteToReplace.source === NoteSource.Remote) {
          console.warn("Refusing to edit remote note.", noteToReplace);
          return;
        }
        const updateIdx = localNotesDecorated.indexOf(noteToReplace);
        const newNotes = localNotes.notes.map((note, idx) => (updateIdx === idx ? newNote : note));
        updateLocalNotes(localNotes, {
          ...localNotes,
          notes: newNotes,
        });
      },
      [localNotes, localNotesDecorated, updateLocalNotes],
    ),
    handleDeleteNote: useCallback(
      (noteToDelete) => {
        if (noteToDelete.source === NoteSource.Remote) {
          console.warn("Refusing to remove remote note.", noteToDelete);
          return;
        }
        const noteToDeleteIdx = localNotesDecorated.indexOf(noteToDelete);
        if (noteToDeleteIdx !== -1) {
          const updatedNotes = localNotes.notes.slice();
          updatedNotes.splice(noteToDeleteIdx, 1);

          updateLocalNotes(
            { ...localNotes },
            {
              ...localNotes,
              notes: updatedNotes,
            },
          );
        }
      },
      [localNotes, localNotesDecorated, updateLocalNotes],
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
          newNotes = importNotesFromJson(jsonStr, `${LABEL_IMPORTED}${label}`).notes;
        } catch (e) {
          alert("Unable to read given notes file. See console for error.");
          console.error(e);
          return;
        }

        // merge notes together
        updateLocalNotes(localNotes, {
          ...localNotes,
          notes: [...localNotes.notes, ...newNotes],
        });
      },
      [localNotes, updateLocalNotes],
    ),
    handleExport() {
      const fileName = `graypaper-notes-${new Date().toISOString()}.json`;
      downloadNotesAsJson(localNotes, fileName);
    },
    handleLegacyExport() {
      const strNotes = loadLegacyFromLocalStorage() ?? "[]";
      const fileName = `old-graypaper-notes-${new Date().toISOString()}.json`;
      downloadJsonFile(strNotes, fileName);
    },
  };

  return <NotesContext.Provider value={context}>{children}</NotesContext.Provider>;
}
