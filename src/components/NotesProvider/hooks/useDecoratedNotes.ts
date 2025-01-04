import { useCallback, useContext } from "react";
import { CodeSyncContext, type ICodeSyncContext } from "../../CodeSyncProvider/CodeSyncProvider";
import type { IDecoratedNote, NoteSource } from "../types/DecoratedNote";
import type { INoteV3, IStorageNote } from "../types/StorageNote";

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
        notes.map(
          (note, index) =>
            new Promise<IDecoratedNote>((resolve, reject) => {
              // Since migrating the note is pretty CPU intensive (looking up levenstein distance)
              // it may block the main thread if there is quite a bit of notes.
              // So instead we schedule micro-tasks so that it's possible to render stuff in-between.
              setTimeout(async () => {
                try {
                  resolve(await decorateNote(migrateSelection, currentVersion, source, note, index));
                } catch (e) {
                  reject(e);
                }
              }, index);
            }),
        ),
      );
    },
    [migrateSelection],
  );
}

async function decorateNote(
  migrateSelection: ICodeSyncContext["migrateSelection"],
  currentVersion: string,
  source: NoteSource,
  note: INoteV3,
  idx: number,
): Promise<IDecoratedNote> {
  // TODO [ToDr] We can potentially cache that by re-using the migrations
  // that were already done.
  const { version, selectionStart, selectionEnd } = note;
  const key = `${note.date}-${idx}`;
  const isUpToDate = note.version === currentVersion;

  let isMigrated = false;
  let newSelection = null;
  if (!isUpToDate) {
    newSelection = await migrateSelection({ selectionStart, selectionEnd }, version, currentVersion);
    if (newSelection !== null) {
      isMigrated = true;
    } else {
      // we perform another attempt but only with the selectionStart block.
      newSelection = await migrateSelection({ selectionStart, selectionEnd: selectionStart }, version, currentVersion);
    }
  }

  const current = !newSelection
    ? {
        isUpToDate,
        isMigrated,
        version,
        selectionStart,
        selectionEnd,
      }
    : {
        isUpToDate,
        isMigrated,
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
}
