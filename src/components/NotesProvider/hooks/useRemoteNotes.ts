import { useEffect, useMemo, useState } from "react";
import { LABEL_REMOTE } from "../consts/labels";
import { type IDecoratedNote, NoteSource } from "../types/DecoratedNote";
import type { IRemoteSource } from "../types/RemoteSource";
import type { INotesEnvelope, IStorageNote } from "../types/StorageNote";
import { importNotesFromJson } from "../utils/notesImportExport";
import type { useDecoratedNotes } from "./useDecoratedNotes";

export function useRemoteNotes(
  sources: IRemoteSource[],
  decorateNotes: ReturnType<typeof useDecoratedNotes>,
  currentVersion: string,
) {
  const remoteNotesSources = useMemo(() => {
    return (
      sources
        // only enabled sources
        .filter((x) => x.isEnabled)
        // only if version is supported
        .filter((x) => x.versions === null || x.versions.includes(currentVersion))
        .map((x) => x.url)
    );
  }, [sources, currentVersion]);
  const [remoteNotes, setRemoteNotes] = useState<INotesEnvelope>({ version: 3, notes: [] });
  const [remoteNotesReady, setRemoteNotesReady] = useState<boolean>(false);
  const [remoteNotesDecorated, setRemoteNotesDecorated] = useState<IDecoratedNote[]>([]);

  // load remote notes
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const newRemoteNotes: IStorageNote[] = [];
      for (const source of remoteNotesSources) {
        try {
          const data = await fetch(source);
          if (cancelled) break;
          const content = await data.text();
          if (cancelled) break;
          const notes = importNotesFromJson(content, { defaultLabel: LABEL_REMOTE });
          newRemoteNotes.push(...notes.notes);
        } catch (e) {
          console.warn(`Error loading remote notes from ${source}`, e);
        }
      }

      if (!cancelled) {
        setRemoteNotes((envelope) => ({
          ...envelope,
          notes: newRemoteNotes,
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [remoteNotesSources]);

  // auto-decorate remote notes
  useEffect(() => {
    let cancelled = false;
    setRemoteNotesReady(false);

    decorateNotes(remoteNotes.notes, NoteSource.Remote, currentVersion).then((notes) => {
      if (cancelled) return;
      setRemoteNotesDecorated(notes);
      setRemoteNotesReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [remoteNotes, currentVersion, decorateNotes]);

  return {
    remoteNotesDecorated,
    remoteNotesReady,
  };
}
