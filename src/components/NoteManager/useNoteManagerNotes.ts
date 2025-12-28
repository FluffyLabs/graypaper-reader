import { useContext, useEffect, useRef, useState } from "react";
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

  const { getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock } = useContext(
    CodeSyncContext,
  ) as ICodeSyncContext;

  const latestHandleAddNote = useLatestCallback(handleAddNote);
  const latestDeleteNote = useLatestCallback(handleDeleteNote);
  const latestUpdateNote = useLatestCallback(handleUpdateNote);
  const [notesManagerNotes, setNotesManagerNotes] = useState<INotesMangerNote[]>([]);
  const [sectionTitlesLoaded, setSectionTitlesLoaded] = useState(false);

  const metadataCacheByKey = useRef(new Map<string, INotesMangerNote["metadata"]>());

  useEffect(() => {
    let canceled = false;
    if (!notesReady) {
      setSectionTitlesLoaded(false);
      return;
    }

    (async () => {
      setSectionTitlesLoaded(false);
      const newNotesManagerNotes: INotesMangerNote[] = [];

      const promiseArray: Promise<[INotesMangerNote["metadata"], IDecoratedNote]>[] = [];

      const timeStamp = Date.now();

      for (const maybeNewNote of notes) {
        const cachedEntry = metadataCacheByKey.current.get(maybeNewNote.key);
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
          cacheByKey: new Set<string>(notes.map((note) => note.key)),
        };
        metadataCacheByKey.current.set(note.key, noteManagerNote.metadata);
        newNotesManagerNotes.push(noteManagerNote);
      }

      const endTimeStamp = Date.now();
      console.log(`getSectionTitles took ${endTimeStamp - timeStamp}ms`);

      setSectionTitlesLoaded(true);
      setNotesManagerNotes(newNotesManagerNotes);
    })();

    return () => {
      console.timeEnd();
      canceled = true;
    };
  }, [notes, notesReady, getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock]);

  return {
    notesReady,
    activeNotes,
    sectionTitlesLoaded,
    notes,
    notesManagerNotes,
    latestHandleAddNote,
    latestDeleteNote,
    latestUpdateNote,
  };
};

async function getSectionTitles(
  note: IDecoratedNote,
  {
    getSectionTitleAtSynctexBlock,
    getSubsectionTitleAtSynctexBlock,
  }: Pick<ICodeSyncContext, "getSectionTitleAtSynctexBlock" | "getSubsectionTitleAtSynctexBlock">,
) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const [sectionTitle, subSectionTitle] = await Promise.all([
    getSectionTitleAtSynctexBlock(note.current.selectionStart),
    getSubsectionTitleAtSynctexBlock(note.current.selectionStart),
  ]);

  return {
    sectionTitle: sectionTitle ?? "",
    subSectionTitle: subSectionTitle ?? "",
  };
}
