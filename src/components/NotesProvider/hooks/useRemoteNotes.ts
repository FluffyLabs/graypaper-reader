import { useEffect, useState } from "react";
import { LABEL_REMOTE } from "../consts/labels";
import { type IDecoratedNote, NoteSource } from "../types/DecoratedNote";
import type { INotesEnvelope, IStorageNote } from "../types/StorageNote";
import { importNotesFromJson } from "../utils/notesImportExport";
import type { useDecoratedNotes } from "./useDecoratedNotes";

export function useRemoteNotes(decorateNotes: ReturnType<typeof useDecoratedNotes>, currentVersion: string) {
  const [remoteNotesSources] = useState([
    "https://fluffylabs.dev/graypaper-notes/2024-element.json",
    "https://fluffylabs.dev/graypaper-notes/version-0.5.4.json",
  ]);
  const [remoteNotes, setRemoteNotes] = useState<INotesEnvelope>({ version: 3, notes: [] });
  const [remoteNotesReady, setRemoteNotesReady] = useState<boolean>(false);
  const [remoteNotesDecorated, setRemoteNotesDecorated] = useState<IDecoratedNote[]>([]);

  // load remote notes
  useEffect(() => {
    (async () => {
      const newRemoteNotes: IStorageNote[] = [];
      for (const source of remoteNotesSources) {
        try {
          const data = await fetch(source);
          const content = await data.text();
          const notes = importNotesFromJson(content, LABEL_REMOTE);
          newRemoteNotes.push(...notes.notes);
        } catch (e) {
          console.warn(`Error loading remote notes from ${source}`, e);
        }
      }
      setRemoteNotes((envelope) => ({
        ...envelope,
        notes: newRemoteNotes,
      }));
    })();
  }, [remoteNotesSources]);

  // auto-decorate remote notes
  useEffect(() => {
    setRemoteNotesReady(false);
    decorateNotes(remoteNotes.notes, NoteSource.Remote, currentVersion).then((notes) => {
      setRemoteNotesDecorated(notes);
      setRemoteNotesReady(true);
    });
  }, [remoteNotes, currentVersion, decorateNotes]);

  return {
    remoteNotesDecorated,
    remoteNotesReady,
  };
}
