import {useEffect, useState} from "react";
import {useDecoratedNotes} from "./useDecoratedNotes";
import {LABEL_REMOTE} from "../consts/labels";
import {importNotesFromJson} from "../utils/notesImportExport";
import {INotesEnvelope, IStorageNote} from "../types/StorageNote";
import {IDecoratedNote, NoteSource} from "../types/DecoratedNote";

export function useRemoteNotes(migrateNotes: ReturnType<typeof useDecoratedNotes>, currentVersion: string) {
  const [remoteNotesSources] = useState([]);
  const [remoteNotes, setRemoteNotes] = useState<INotesEnvelope>({ version: 3, notes: [] });
  const [remoteNotesMigrated, setRemoteNotesMigrated] = useState<IDecoratedNote[]>([]);

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
      setRemoteNotes(envelope => ({
        ...envelope,
        notes: newRemoteNotes,
      }));
    })();
  }, [remoteNotesSources]);

  // auto-migrate remote notes
  useEffect(() => {
    migrateNotes(remoteNotes.notes, NoteSource.Remote, currentVersion).then((notes) => {
      setRemoteNotesMigrated(notes);
    });
  }, [remoteNotes, currentVersion, migrateNotes]);

  return remoteNotesMigrated;
}
