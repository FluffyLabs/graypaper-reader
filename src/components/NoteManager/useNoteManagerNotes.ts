import { useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    let canceled = false;
    if (!notesReady) {
      setSectionTitlesLoaded(false);
      return;
    }

    (async () => {
      setSectionTitlesLoaded(false);
      const results = Promise.all(
        notes.map((note) =>
          getSectionTitles(note, {
            getSectionTitleAtSynctexBlock,
            getSubsectionTitleAtSynctexBlock,
          }).then((sectionTitle) => {
            return [sectionTitle, note] as const;
          }),
        ),
      );

      const timeStamp = Date.now();
      const newNotesManagerNotes: INotesMangerNote[] = [];
      for (const result of await results) {
        if (canceled) return;
        const [sectionTitles, note] = result;
        newNotesManagerNotes.push({
          noteObject: note,
          metadata: {
            sectionTitle: sectionTitles.sectionTitle,
            subSectionTitle: sectionTitles.subSectionTitle,
          },
        });
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
