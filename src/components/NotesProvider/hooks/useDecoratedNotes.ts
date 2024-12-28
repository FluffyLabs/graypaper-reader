import {useCallback, useContext} from "react";
import {xxhash32} from "hash-wasm";
import {IDecoratedNote, NoteSource} from "../types/DecoratedNote";
import {CodeSyncContext, ICodeSyncContext} from "../../CodeSyncProvider/CodeSyncProvider";
import {IStorageNote} from "../types/StorageNote";

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
        notes.map(async (note): Promise<IDecoratedNote> => {
          // TODO [ToDr] We can potentially cache that by re-using the migrations
          // that were already done.
          const { version, selectionStart, selectionEnd } = note;
          const id = await xxhash32(`${source}-${note.version}-${note.date}-${note.content}`);
          const newSelection = note.version !== currentVersion
            ? await migrateSelection({ selectionStart, selectionEnd }, version, currentVersion)
            : null;

          if (!newSelection) {
            return {
              id,
              original: note,
              source,
              canBeMigrated: false,
              version,
              selectionStart,
              selectionEnd,
            };
          }

          return {
            id,
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
}
