import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { LABEL_IMPORTED } from "./consts/labels";
import { NEW_REMOTE_SOURCE_ID } from "./consts/remoteSources";
import { useDecoratedNotes } from "./hooks/useDecoratedNotes";
import { type ILabelTreeNode, getFilteredNotes, useLabels } from "./hooks/useLabels";
import { useRemoteNotes } from "./hooks/useRemoteNotes";
import { type IDecoratedNote, NoteSource } from "./types/DecoratedNote";
import type { IRemoteSource } from "./types/RemoteSource";
import type { INotesEnvelope, IStorageNote } from "./types/StorageNote";
import { areSelectionsEqual } from "./utils/areSelectionsEqual";
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
  activeNotes: Set<IDecoratedNote>;
  labels: ILabelTreeNode[];
  canUndo: boolean;
  canRedo: boolean;
  remoteSources: IRemoteSource[];
  handleSetRemoteSources(r: IRemoteSource, remove?: true): void;
  handleAddNote(note: IStorageNote): { isVisible: boolean };
  handleUpdateNote(noteToReplace: IDecoratedNote, newNote: IStorageNote): { isVisible: boolean };
  handleDeleteNote(note: IDecoratedNote): void;
  handleUndo(): void;
  handleRedo(): void;
  handleImport(jsonStr: string, label: string): void;
  handleExport(): void;
  handleDeleteNotes(): void;
  handleToggleLabel(label: ILabelTreeNode): void;
}

interface INotesProviderProps {
  children: ReactNode;
}

const emptyActiveNotes = new Set<IDecoratedNote>();

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
    let isCancelled = false;

    setLocalNotesReady(false);
    decorateNotes(localNotes.notes, NoteSource.Local, currentVersion).then((notes) => {
      if (!isCancelled) {
        setLocalNotesDecorated(notes);
        setLocalNotesReady(true);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [localNotes.notes, currentVersion, decorateNotes]);

  // Local and remote notes merged together.
  const allNotes = useMemo(
    () => [...localNotesDecorated, ...remoteNotesDecorated],
    [localNotesDecorated, remoteNotesDecorated],
  );

  const allNotesReady = useMemo(() => localNotesReady && remoteNotesReady, [localNotesReady, remoteNotesReady]);

  const { filteredNotes, labels, toggleLabel: handleToggleLabel, isVisibleByActiveLabelsLatest } = useLabels(allNotes);

  const handleSetRemoteSources = useCallback((newSource: IRemoteSource, remove?: true) => {
    setRemoteSources((prevRemoteSources) => {
      let newRemoteSources = prevRemoteSources;
      if (newSource.id === NEW_REMOTE_SOURCE_ID) {
        const newId = 1 + Math.max(NEW_REMOTE_SOURCE_ID, ...prevRemoteSources.map((x) => x.id));
        const newSourceWithSafeId = { ...newSource, id: newId };
        newRemoteSources = [...prevRemoteSources, newSourceWithSafeId];
      } else {
        newRemoteSources = prevRemoteSources
          .map((x) => (x.id === newSource.id ? newSource : x))
          .filter((x) => (remove === true ? x.id !== newSource.id : true));
      }
      remote.saveToLocalStorage(newRemoteSources);
      return newRemoteSources;
    });
  }, []);

  const activeNotes = useMemo(() => {
    if (!locationParams || !locationParams.selectionStart || !locationParams.selectionEnd) return emptyActiveNotes;

    const { selectionStart, selectionEnd } = locationParams;

    const activeNotesArray = filteredNotes.filter((note) =>
      areSelectionsEqual(note.current, { selectionStart, selectionEnd }),
    );
    return new Set(activeNotesArray);
  }, [filteredNotes, locationParams]);

  const context: INotesContext = {
    notesPinned,
    setNotesPinned,
    notesReady: allNotesReady,
    notes: filteredNotes,
    activeNotes,
    remoteSources,
    labels,
    canUndo,
    canRedo,
    handleSetRemoteSources,
    handleToggleLabel,
    handleAddNote: useCallback(
      (note) => {
        const isVisible = isVisibleByActiveLabelsLatest.current(note);

        updateLocalNotes(localNotes, {
          ...localNotes,
          notes: [note, ...localNotes.notes],
        });

        return { isVisible };
      },
      [localNotes, updateLocalNotes, isVisibleByActiveLabelsLatest],
    ),
    handleUpdateNote: useCallback(
      (noteToReplace, newNote) => {
        if (noteToReplace.source === NoteSource.Remote) {
          console.warn("Refusing to edit remote note.", noteToReplace);
          return { isVisible: true };
        }

        const isVisible = isVisibleByActiveLabelsLatest.current(newNote);

        const updateIdx = localNotesDecorated.indexOf(noteToReplace);
        const newNotes = localNotes.notes.map((note, idx) => (updateIdx === idx ? newNote : note));
        updateLocalNotes(localNotes, {
          ...localNotes,
          notes: newNotes,
        });

        return { isVisible };
      },
      [localNotes, localNotesDecorated, updateLocalNotes, isVisibleByActiveLabelsLatest],
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
          newNotes = importNotesFromJson(jsonStr, { mustHaveLabel: `${LABEL_IMPORTED}${label}` }).notes;
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
      const activeLabels = labels.filter((label) => label.isActive).map((label) => label.prefixedLabel);

      const fileName = `removed-graypaper-notes-${new Date().toISOString()}.json`;
      const deletedNotes = getFilteredNotes(localNotes.notes, activeLabels);
      downloadNotesAsJson({ version: 3, notes: deletedNotes }, fileName);

      const updatedNotes = getFilteredNotes(localNotes.notes, activeLabels, { includesLabel: false });
      updateLocalNotes(localNotes, { ...localNotes, notes: updatedNotes });
    }, [localNotes, labels, updateLocalNotes]),
  };

  return <NotesContext.Provider value={context}>{children}</NotesContext.Provider>;
}
