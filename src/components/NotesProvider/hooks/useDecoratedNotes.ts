import { useCallback, useContext } from "react";
import { CodeSyncContext, type ICodeSyncContext } from "../../CodeSyncProvider/CodeSyncProvider";
import type { IDecoratedNote, NoteSource } from "../types/DecoratedNote";
import type { IStorageNote } from "../types/StorageNote";

/**
 * Decorate notes coming from storage (or remote source) and attach additional details, like:
 * 1. Source of the note
 * 2. Synctex blocks migrated to the current document version (if possible).
 * 3. Unique hash of the node that can be reliably used for identification.
 */
export function useDecoratedNotes() {
  const { migrateSelection } = useContext(CodeSyncContext) as ICodeSyncContext;

  return useCallback(
    (notes: IStorageNote[], source: NoteSource, currentVersion: string) => {
      return Promise.all(
        notes.map(async (note, idx): Promise<IDecoratedNote> => {
          // TODO [ToDr] We can potentially cache that by re-using the migrations
          // that were already done.
          const { version, selectionStart, selectionEnd } = note;
          const key = `${note.date}-${idx}`;
          const isUpToDate = note.version === currentVersion;
          const newSelection = !isUpToDate
            ? await migrateSelection({ selectionStart, selectionEnd }, version, currentVersion)
            : null;

          const current = !newSelection
            ? {
                isUpToDate,
                isMigrated: false,
                version,
                selectionStart,
                selectionEnd,
              }
            : {
                isUpToDate,
                isMigrated: true,
                version: currentVersion,
                selectionStart: newSelection.selectionStart,
                selectionEnd: newSelection.selectionEnd,
              };

          return {
            key,
            source,
            original: note,
            current,
          };
        }),
      );
    },
    [migrateSelection],
  );
}
