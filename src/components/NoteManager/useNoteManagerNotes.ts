import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLatestCallback } from "../../hooks/useLatestCallback";
import { CodeSyncContext, type ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { type INotesContext, NotesContext } from "../NotesProvider/NotesProvider";
import type { IDecoratedNote } from "../NotesProvider/types/DecoratedNote";

export type INotesMangerNote = {
  noteObject: IDecoratedNote;
  metadata: {
    sectionTitle: string;
    subSectionTitle: string;
  };
};

export const useNoteManagerNotes = () => {
  const { notesReady, activeNotes, notes, handleAddNote, handleDeleteNote, handleUpdateNote } = useContext(
    NotesContext,
  ) as INotesContext;

  const { getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock, isSynctexLoaded } = useContext(
    CodeSyncContext,
  ) as ICodeSyncContext;

  const metadataCacheByKey = useRef(new Map<string, INotesMangerNote["metadata"]>());

  const latestHandleAddNote = useLatestCallback(handleAddNote);
  const latestDeleteNote = useLatestCallback(handleDeleteNote);
  const latestUpdateNote = useLatestCallback(handleUpdateNote);

  const addNote = useCallback<INotesContext["handleAddNote"]>(
    (noteToAdd) => {
      const { isVisible } = latestHandleAddNote.current(noteToAdd);

      return { isVisible };
    },
    [latestHandleAddNote],
  );

  const updateNote = useCallback<INotesContext["handleUpdateNote"]>(
    (noteToReplace, newNote) => {
      metadataCacheByKey.current.delete(createNoteCacheKey(noteToReplace));
      return latestUpdateNote.current(noteToReplace, newNote);
    },
    [latestUpdateNote],
  );
  const deleteNote = useCallback<INotesContext["handleDeleteNote"]>(
    (noteToDelete) => {
      metadataCacheByKey.current.delete(createNoteCacheKey(noteToDelete));
      latestDeleteNote.current(noteToDelete);
    },
    [latestDeleteNote],
  );

  const [notesManagerNotes, setNotesManagerNotes] = useState<INotesMangerNote[]>([]);
  const [sectionTitlesLoaded, setSectionTitlesLoaded] = useState(false);

  useEffect(() => {
    let canceled = false;
    if (!notesReady || !isSynctexLoaded) {
      setSectionTitlesLoaded(false);
      return;
    }

    (async () => {
      setSectionTitlesLoaded(false);
      const newNotesManagerNotes: INotesMangerNote[] = [];

      const promiseArray: Promise<[INotesMangerNote["metadata"], IDecoratedNote]>[] = [];

      for (const maybeNewNote of notes) {
        const cachedEntry = metadataCacheByKey.current.get(createNoteCacheKey(maybeNewNote));
        if (cachedEntry) {
          promiseArray.push(Promise.resolve([cachedEntry, maybeNewNote]));
        } else {
          promiseArray.push(
            getSectionTitles(maybeNewNote, {
              getSectionTitleAtSynctexBlock,
              getSubsectionTitleAtSynctexBlock,
            }).then((sectionTitle) => {
              return [sectionTitle, maybeNewNote] as const;
            }),
          );
        }
      }

      const asyncResults = Promise.all(promiseArray);

      for (const result of await asyncResults) {
        if (canceled) return;
        const [sectionTitles, note] = result;

        const noteManagerNote = {
          noteObject: note,
          metadata: {
            sectionTitle: sectionTitles.sectionTitle,
            subSectionTitle: sectionTitles.subSectionTitle,
          },
        };
        metadataCacheByKey.current.set(createNoteCacheKey(note), noteManagerNote.metadata);
        newNotesManagerNotes.push(noteManagerNote);
      }

      setSectionTitlesLoaded(true);
      setNotesManagerNotes(newNotesManagerNotes);
    })();

    return () => {
      canceled = true;
    };
  }, [notes, notesReady, getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock, isSynctexLoaded]);

  return {
    notesReady,
    activeNotes,
    sectionTitlesLoaded,
    notes,
    notesManagerNotes,
    addNote,
    deleteNote,
    updateNote,
  };
};

async function getSectionTitles(
  note: IDecoratedNote,
  {
    getSectionTitleAtSynctexBlock,
    getSubsectionTitleAtSynctexBlock,
  }: Pick<ICodeSyncContext, "getSectionTitleAtSynctexBlock" | "getSubsectionTitleAtSynctexBlock">,
) {
  const [sectionTitle, subSectionTitle] = await Promise.all([
    getSectionTitleAtSynctexBlock(note.current.selectionStart),
    getSubsectionTitleAtSynctexBlock(note.current.selectionStart),
  ]);

  return {
    sectionTitle: sectionTitle ?? "",
    subSectionTitle: subSectionTitle ?? "",
  };
}

const createNoteCacheKey = (note: IDecoratedNote) => {
  return JSON.stringify({
    key: note.key,
    start: note.current.selectionStart,
    end: note.current.selectionEnd,
    version: note.current.version,
  });
};
