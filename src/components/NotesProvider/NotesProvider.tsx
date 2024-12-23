import type { ISelectionParams } from "@fluffylabs/types";
import { xxhash32 } from "hash-wasm";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CodeSyncContext, type ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";

const LOCAL_STORAGE_KEY = "notes-v2";
const BACKUP_STORAGE_KEY = "notes-v2-backup";
const LEGACY_NOTES_LS_KEY = "notes";
const HISTORY_STEPS_LIMIT = 10;

export const LABEL_LOCAL = "local";
export const LABEL_REMOTE = "remote";
export const LABEL_IMPORTED = "imported:";

export const NotesContext = createContext<INotesContext | null>(null);

export interface INotesContext {
  notes: INote[];
  labels: Label[];
  canUndo: boolean;
  hasLegacyNotes: boolean;
  handleAddNote(note: INoteV3): void;
  handleUpdateNote(noteToReplace: INote, newNote: INoteV3): void;
  handleDeleteNote(note: INote): void;
  handleUndo(): void;
  handleImport(jsonStr: string, label: string): void;
  handleExport(): void;
  handleLegacyExport(): void;
  handleToggleLabel(label: string): void;
}

export type Label = {
  label: string;
  isActive: boolean;
};

export enum NoteSource {
  Local = 0,
  Imported = 1,
  Remote = 2,
}

/** Note this type should not be changed since it describes an older format of the notes.*/
interface INoteV2 extends ISelectionParams {
  content: string;
  date: number;
  // Always empty
  author: string;
  pageNumber: number;
  version: string;
  selectionString: string;
}

export interface INoteV3 extends ISelectionParams {
  noteVersion: 3;
  content: string;
  date: number;
  author: string;
  version: string;
  labels: string[];
}

interface INotesV3 {
  version: 3;
  notes: INoteV3[];
}

export type INote = ISelectionParams & {
  /** Unique id of the note (date + content) */
  hash: string;
  original: INoteV3;
  source: NoteSource;

  canBeMigrated: boolean;
  version: string;
};

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
  if (!(typeof arg === "object" && arg !== null)) return false;
  if (!("noteVersion" in arg && arg.noteVersion === 3)) return false;
  if (!("content" in arg && typeof arg.content === "string")) return false;
  if (!("date" in arg && typeof arg.date === "number")) return false;
  if (!("author" in arg && typeof arg.author === "string")) return false;
  if (!("version" in arg && typeof arg.version === "string")) return false;
  if (!("labels" in arg && Array.isArray(arg.labels))) return false;

  return true;
}

function isINotesV3(arg: unknown): arg is INotesV3 {
  if (!(typeof arg === "object" && arg !== null)) return false;
  if (!("version" in arg && arg.version === 3)) return false;
  if (!("notes" in arg && Array.isArray(arg.notes))) return false;

  return arg.notes.every(isINoteV3);
}

function parseNotesFromJson(jsonStr: string, defaultLabel: string): INotesV3 {
  try {
    const parsed: unknown = JSON.parse(jsonStr);
    // V3
    if (isINotesV3(parsed)) {
      return parsed;
    }

    // V2
    if (Array.isArray(parsed)) {
      if (parsed.every(isINoteV2)) {
        return {
          version: 3,
          notes: parsed.map((note) => convertNoteV2toV3(note, defaultLabel)),
        };
      }
      throw new Error("Notes JSON should be an array.");
    }

    throw new Error("Invalid notes format.");
  } catch (e) {
    console.error("Error loading notes.", e);
    return {
      version: 3,
      notes: [],
    };
  }
}

function convertNoteV2toV3(note: INoteV2, label: string): INoteV3 {
  return {
    noteVersion: 3,
    content: note.content,
    date: note.date,
    author: note.author,
    version: note.version,
    labels: [label],
    selectionStart: note.selectionStart,
    selectionEnd: note.selectionEnd,
  };
}

function loadFromLocalStorage(): INotesV3 {
  return parseNotesFromJson(window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? "[]", LABEL_LOCAL);
}

function loadLegacyFromLocalStorage(): string | null {
  return window.localStorage.getItem(LEGACY_NOTES_LS_KEY);
}

function saveToLocalStorage(notes: INoteV3[]): void {
  const notesWrapper: INotesV3 = {
    version: 3,
    notes,
  };
  try {
    const prev = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    // make a backup just for safety.
    if (prev) {
      window.localStorage.setItem(BACKUP_STORAGE_KEY, prev);
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notesWrapper));
  } catch (e) {
    alert(`Unable to save notes: ${e}`);
  }
}

export function NotesProvider({ children }: INotesProviderProps) {
  const [localNotes, setLocalNotes] = useState<INoteV3[]>(loadFromLocalStorage().notes);
  const [localNotesMigrated, setLocalNotesMigrated] = useState<INote[]>([]);
  const [history, setHistory] = useState<INoteV3[][]>([]);
  const [hasLegacyNotes, setHasLegacyNotes] = useState<boolean>(false);
  const { locationParams } = useContext(LocationContext) as ILocationContext;

  const currentVersion = locationParams.version;
  const canUndo = history.length > 0;

  const migrateNotes = useNotesMigration();
  const remoteNotesMigrated = useRemoteNotes(migrateNotes, currentVersion);

  const updateLocalNotes = useCallback((currentNotes: INoteV3[], newNotes: INoteV3[]) => {
    setHistory((history) => [...history, currentNotes].slice(-1 * HISTORY_STEPS_LIMIT));
    setLocalNotes(newNotes);
    saveToLocalStorage(newNotes);
  }, []);

  // Legacy notes export indicator
  useEffect(() => {
    const localStorageContent = loadLegacyFromLocalStorage();
    setHasLegacyNotes(!!localStorageContent && localStorageContent !== "[]");
  });

  // Local notes migration
  useEffect(() => {
    migrateNotes(localNotes, NoteSource.Local, currentVersion).then((notes) => {
      setLocalNotesMigrated(notes);
    });
  }, [localNotes, currentVersion, migrateNotes]);

  const allNotes = useMemo(
    () => [...localNotesMigrated, ...remoteNotesMigrated],
    [localNotesMigrated, remoteNotesMigrated],
  );

  const [filteredNotes, labels, handleToggleLabel] = useLabels(allNotes);

  const context: INotesContext = {
    notes: filteredNotes,
    labels,
    canUndo,
    hasLegacyNotes,
    handleToggleLabel,
    handleAddNote: useCallback(
      (note) => updateLocalNotes(localNotes, [...localNotes, note]),
      [localNotes, updateLocalNotes],
    ),
    handleUpdateNote: useCallback(
      (noteToReplace, newNote) => {
        if (noteToReplace.source === NoteSource.Remote) {
          console.warn("Refusing to edit remote note.", noteToReplace);
          return;
        }
        const updateIdx = localNotesMigrated.indexOf(noteToReplace);
        const newNotes = localNotes.map((note, idx) => (updateIdx === idx ? newNote : note));
        updateLocalNotes(localNotes, newNotes);
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
          const currentNotes = localNotes.slice();
          localNotes.splice(noteToDeleteIdx, 1);
          updateLocalNotes(currentNotes, [...localNotes]);
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
          newNotes = parseNotesFromJson(jsonStr, `${LABEL_IMPORTED}${label}`).notes;
        } catch (e) {
          alert("Unable to read given notes file. See console for error.");
          console.error(e);
          return;
        }

        // merge notes together
        updateLocalNotes(localNotes, [...localNotes, ...newNotes]);
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

export function useRemoteNotes(migrateNotes: ReturnType<typeof useNotesMigration>, currentVersion: string) {
  const [remoteNotesSources] = useState([]);
  const [remoteNotes, setRemoteNotes] = useState<INoteV3[]>([]);
  const [remoteNotesMigrated, setRemoteNotesMigrated] = useState<INote[]>([]);

  // load remote notes
  useEffect(() => {
    (async () => {
      const newRemoteNotes = [];
      for (const source of remoteNotesSources) {
        try {
          const data = await fetch(source);
          const content = await data.text();
          const notes = parseNotesFromJson(content, LABEL_REMOTE);
          newRemoteNotes.push(...notes.notes);
        } catch (e) {
          console.warn(`Error loading remote notes from ${source}`, e);
        }
      }
      setRemoteNotes(newRemoteNotes);
    })();
  }, [remoteNotesSources]);

  // auto-migrate remote notes
  useEffect(() => {
    migrateNotes(remoteNotes, NoteSource.Remote, currentVersion).then((notes) => {
      setRemoteNotesMigrated(notes);
    });
  }, [remoteNotes, currentVersion, migrateNotes]);

  return remoteNotesMigrated;
}

function useLabels(allNotes: INote[]): [INote[], Label[], (label: string) => void] {
  const [labels, setLabels] = useState<Label[]>([]);

  // toggle label visibility
  const toggleLabel = useCallback((label: string) => {
    setLabels((labels) => {
      return labels.map((x) => {
        if (x.label === label) {
          x.isActive = !x.isActive;
        }
        return x;
      });
    });
  }, []);

  // Re-create labels on change in notes
  useEffect(() => {
    const uniqueLabels = new Set<string>();
    allNotes.map((note) => {
      note.original.labels.map((label) => {
        uniqueLabels.add(label);
      });
    });

    setLabels((oldLabels) => {
      const justNames = oldLabels.map((x) => x.label);
      return Array.from(uniqueLabels.values()).map((label) => {
        const oldLabelIdx = justNames.indexOf(label as string);
        if (oldLabelIdx === -1) {
          return { label: label as string, isActive: true };
        }
        return oldLabels[oldLabelIdx];
      });
    });
  }, [allNotes]);

  // filter notes when labels are changing
  const filteredNotes = useMemo(() => {
    // build a map
    const active = new Map<string, boolean>();
    labels.map((x) => active.set(x.label, x.isActive));

    // filter out notes
    return allNotes.filter((note) => {
      const activeLabels = note.original.labels.filter((label) => active.get(label));
      return activeLabels.length > 0;
    });
  }, [allNotes, labels]);

  return [filteredNotes, labels, toggleLabel];
}

function useNotesMigration() {
  const { migrateSelection } = useContext(CodeSyncContext) as ICodeSyncContext;
  const migrateNotes = useCallback(
    (notes: INoteV3[], source: NoteSource, currentVersion: string) => {
      return Promise.all(
        notes.map(async (note): Promise<INote> => {
          // TODO [ToDr] We can potentially cache that by re-using the migrations
          // that were already done.
          const { version, selectionStart, selectionEnd } = note;
          const hash = await xxhash32(`${source}-${note.version}-${note.date}-${note.content}`);
          if (note.version === currentVersion) {
            return {
              hash,
              original: note,
              source,
              canBeMigrated: false,
              version,
              selectionStart,
              selectionEnd,
            };
          }

          const newSelection = await migrateSelection({ selectionStart, selectionEnd }, version, currentVersion);

          if (!newSelection) {
            return {
              hash,
              original: note,
              source,
              canBeMigrated: false,
              version,
              selectionStart,
              selectionEnd,
            };
          }

          return {
            hash,
            original: note,
            source,
            canBeMigrated: true,
            version: currentVersion,
            selectionStart: newSelection.selectionStart,
            selectionEnd: newSelection.selectionEnd,
          };
        }),
      );
    },
    [migrateSelection],
  );

  return migrateNotes;
}

function downloadNotes(strNotes: string, fileName: string) {
  const link = document.createElement("a");
  link.setAttribute("href", `data:application/json;charset=utf-8,${encodeURIComponent(strNotes)}`);
  link.setAttribute("download", fileName);
  link.click();
}
