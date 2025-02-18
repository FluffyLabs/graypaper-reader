import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { LABEL_IMPORTED, LABEL_LOCAL, LABEL_REMOTE } from "./consts/labels";
import { NEW_REMOTE_SOURCE_ID } from "./consts/remoteSources";
import { useDecoratedNotes } from "./hooks/useDecoratedNotes";
import { type ILabel, useLabels } from "./hooks/useLabels";
import { useRemoteNotes } from "./hooks/useRemoteNotes";
import { type IDecoratedNote, NoteSource } from "./types/DecoratedNote";
import type { IRemoteSource } from "./types/RemoteSource";
import type { INotesEnvelope, IStorageNote } from "./types/StorageNote";
import { downloadNotesAsJson, importNotesFromJson } from "./utils/notesImportExport";
import * as notes from "./utils/notesLocalStorage";
import * as remote from "./utils/remoteSources";

const HISTORY_STEPS_LIMIT = 10;

export const NotesContext = createContext<INotesContext | null>(null);

export interface INotesContext {
  notesPinned: boolean;
  setNotesPinned: (v: boolean) => void;
  notesReady: boolean;
  notes: IDecoratedNote[];
  labels: ILabel[];
  canUndo: boolean;
  canRedo: boolean;
  remoteSources: IRemoteSource[];
  handleSetRemoteSources(r: IRemoteSource, remove?: true): void;
  handleAddNote(note: IStorageNote): void;
  handleUpdateNote(noteToReplace: IDecoratedNote, newNote: IStorageNote): void;
  handleDeleteNote(note: IDecoratedNote): void;
  handleUndo(): void;
  handleRedo(): void;
  handleImport(jsonStr: string, label: string): void;
  handleExport(): void;
  handleDeleteNotes(): void;
  handleToggleLabel(label: string): void;
}

interface INotesProviderProps {
  children: ReactNode;
}

export function NotesProvider({ children }: INotesProviderProps) {
  const [remoteSources, setRemoteSources] = useState<IRemoteSource[]>([]);

  const [notesPinned, setNotesPinned] = useState<boolean>(false);
  const [localNotes, setLocalNotes] = useState<INotesEnvelope>({ version: 3, notes: [] });
  const [localNotesDecorated, setLocalNotesDecorated] = useState<IDecoratedNote[]>([]);
  const [localNotesReady, setLocalNotesReady] = useState<boolean>(false);
  const [history, setHistory] = useState<INotesEnvelope[]>([]);
  const [redoHistory, setRedoHistory] = useState<INotesEnvelope[]>([]);
  const { locationParams } = useContext(LocationContext) as ILocationContext;

  const currentVersion = locationParams.version;
  const canUndo = history.length > 0;
  const canRedo = redoHistory.length > 0;

  // load local notes
  useEffect(() => {
    setLocalNotes(notes.loadFromLocalStorage());
  }, []);

  // load remote sources
  useEffect(() => {
    setRemoteSources(remote.loadFromLocalStorage());
  }, []);

  const decorateNotes = useDecoratedNotes();
  const { remoteNotesDecorated, remoteNotesReady } = useRemoteNotes(remoteSources, decorateNotes, currentVersion);

  // Set in-state local notes, but also update history and local storage.
  const updateLocalNotes = useCallback((currentNotes: INotesEnvelope, newNotes: INotesEnvelope) => {
    setHistory((history) => [...history, currentNotes].slice(-1 * HISTORY_STEPS_LIMIT));
    setLocalNotes(newNotes);
    notes.saveToLocalStorage(newNotes);
  }, []);

  // Decorate all local notes.
  useEffect(() => {
    setLocalNotesReady(false);
    decorateNotes(localNotes.notes, NoteSource.Local, currentVersion).then((notes) => {
      setLocalNotesDecorated(notes);
      setLocalNotesReady(true);
    });
  }, [localNotes.notes, currentVersion, decorateNotes]);

  // Local and remote notes merged together.
  const allNotes = useMemo(
    () => [...localNotesDecorated, ...remoteNotesDecorated],
    [localNotesDecorated, remoteNotesDecorated],
  );

  const allNotesReady = useMemo(() => localNotesReady && remoteNotesReady, [localNotesReady, remoteNotesReady]);

  const [filteredNotes, labels, handleToggleLabel] = useLabels(allNotes);

  const context: INotesContext = {
    notesPinned,
    setNotesPinned,
    notesReady: allNotesReady,
    notes: filteredNotes,
    remoteSources,
    labels,
    canUndo,
    canRedo,
    handleSetRemoteSources: useCallback((newVal: IRemoteSource, remove?: true) => {
      setRemoteSources((remoteSources) => {
        let newRemoteSources = remoteSources;
        if (newVal.id === NEW_REMOTE_SOURCE_ID) {
          newVal.id = 1 + Math.max(NEW_REMOTE_SOURCE_ID, ...remoteSources.map((x) => x.id));
          newRemoteSources = [...remoteSources, newVal];
        } else {
          newRemoteSources = remoteSources
            .map((x) => (x.id === newVal.id ? newVal : x))
            .filter((x) => (remove === true ? x.id !== newVal.id : true));
        }
        remote.saveToLocalStorage(newRemoteSources);
        return newRemoteSources;
      });
    }, []),
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

          updateLocalNotes(localNotes, {
            ...localNotes,
            notes: updatedNotes,
          });
        }
      },
      [localNotes, localNotesDecorated, updateLocalNotes],
    ),
    handleUndo: useCallback(() => {
      const currentNotes = localNotes;
      const previousNotes = history.pop();
      if (!previousNotes) {
        return;
      }

      setRedoHistory((redoHistory) => [...redoHistory, currentNotes]);
      setLocalNotes(previousNotes);
      notes.saveToLocalStorage(previousNotes);
      setHistory([...history]);
    }, [history, localNotes]),
    handleRedo: useCallback(() => {
      const currentNotes = localNotes;
      const previousNotes = redoHistory.pop();
      if (!previousNotes) {
        return;
      }

      updateLocalNotes(currentNotes, previousNotes);
      setRedoHistory([...redoHistory]);
    }, [redoHistory, localNotes, updateLocalNotes]),
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
    handleExport: useCallback(() => {
      const fileName = `graypaper-notes-${new Date().toISOString()}.json`;
      downloadNotesAsJson(localNotes, fileName);
    }, [localNotes]),
    handleDeleteNotes: useCallback(() => {
      const r = confirm("Are you sure you want to delete all filtered notes?");
      if (r === true) {
        const activeLabels = labels
          .filter((label) => label.isActive)
          .map((label) => {
            const parts = label.label.split("/");
            if (parts.length > 1) {
              if (parts[0] === LABEL_LOCAL || parts[0] === LABEL_REMOTE) {
                return parts.slice(1).join("/");
              }
            }
            return label.label;
          });
        console.log("Deleting notes with labels:", activeLabels);
        const updatedNotes = localNotes.notes.filter((note) => {
          if (note.labels.some((label) => activeLabels.includes(label))) {
            return false;
          }
          return true;
        });
        updateLocalNotes(localNotes, { ...localNotes, notes: updatedNotes });
      }
    }, [localNotes, labels, updateLocalNotes]),
  };

  return <NotesContext.Provider value={context}>{children}</NotesContext.Provider>;
}
