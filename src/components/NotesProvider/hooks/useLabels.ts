import { useCallback, useEffect, useMemo, useState } from "react";
import { LABEL_IMPORTED, LABEL_LOCAL, LABEL_REMOTE } from "../consts/labels";
import type { IDecoratedNote } from "../types/DecoratedNote";
import type { IStorageNote } from "../types/StorageNote";
import { loadFromLocalStorage, saveToLocalStorage } from "../utils/labelsLocalStorage";

export type ILabel = {
  label: string;
  isActive: boolean;
};

export function getEditableLabels(
  labels: string[],
  { onlyNonEditable }: { onlyNonEditable: boolean } = { onlyNonEditable: false },
) {
  return labels.filter((label) => {
    if (label === LABEL_LOCAL || label === LABEL_REMOTE || label.startsWith(LABEL_IMPORTED)) {
      return onlyNonEditable;
    }
    return !onlyNonEditable;
  });
}
/**
 * Filter notes based on labels.
 * @param notes List of notes to filter.
 * @param labels List of labels to filter by.
 * @param includesLabel If true, notes must include all labels. If false, notes must not include any of the labels.
 * @returns Filtered list of notes.
 * @see getFilteredDecoratedNotes
 */
export function getFilteredNotes(
  notes: IStorageNote[],
  labels: string[],
  { includesLabel }: { includesLabel: boolean } = { includesLabel: true },
): IStorageNote[] {
  return notes.filter((note) => {
    if (note.labels.every((label) => labels.includes(label))) {
      return includesLabel;
    }
    return !includesLabel;
  });
}

/**
 * Filter decorated notes based on labels.
 * @param notes List of decorated notes to filter.
 * @param labels List of labels to filter by.
 * @param includesLabel If true, notes must include all labels. If false, notes must not include any of the labels.
 * @returns Filtered list of decorated notes.
 * @see getFilteredNotes
 */
export function getFilteredDecoratedNotes(
  notes: IDecoratedNote[],
  labels: string[],
  { includesLabel }: { includesLabel: boolean } = { includesLabel: true },
): IDecoratedNote[] {
  return notes.filter((note) => {
    if (note.original.labels.every((label) => labels.includes(label))) {
      return includesLabel;
    }
    return !includesLabel;
  });
}

/**
 * Maintains a list list of all labels (across all nodes) and allow to activate/deactivate them
 * to filter given list of all decorated notes.
 */
export function useLabels(allNotes: IDecoratedNote[]): [IDecoratedNote[], ILabel[], (label: string) => void] {
  const [storageLabels, setStorageLabels] = useState<ILabel[]>([]);
  const [labels, setLabels] = useState<ILabel[]>([]);

  // load and save storage labels to Local Storage
  useEffect(() => {
    setStorageLabels(loadFromLocalStorage());
  }, []);
  useEffect(() => {
    if (storageLabels.length) {
      saveToLocalStorage(storageLabels);
    }
  }, [storageLabels]);

  // toggle label visibility
  const toggleLabel = useCallback((label: string) => {
    const toggle = (x: ILabel) => {
      if (x.label === label) {
        return {
          ...x,
          isActive: !x.isActive,
        };
      }
      return x;
    };

    let newLabel: ILabel | null = null;
    setLabels((labels) => {
      const newLabels = labels.map(toggle);
      newLabel = newLabels.find((x) => x.label === label) || null;
      return newLabels;
    });
    // NOTE: we update storage labels separately, since they may have more entries
    // than actually displayed labels.
    setStorageLabels((storageLabels) => {
      if (storageLabels.find((x) => x.label === label) !== undefined) {
        return storageLabels.map(toggle);
      }
      if (newLabel !== null) {
        return [...storageLabels, newLabel];
      }
      return storageLabels;
    });
  }, []);

  // maintain a set of labels inactive in local storage.
  const storageActivity = useMemo(() => {
    const activity = new Map<string, boolean>();
    for (const label of storageLabels) {
      activity.set(label.label, label.isActive);
    }
    return activity;
  }, [storageLabels]);

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
        const oldLabelIdx = justNames.indexOf(label);
        const activeByDefault = label !== LABEL_REMOTE;
        const activeInStorage = storageActivity.get(label);
        const isActive = activeInStorage ?? activeByDefault;

        if (oldLabelIdx === -1) {
          return { label, isActive };
        }
        return oldLabels[oldLabelIdx];
      });
    });
  }, [allNotes, storageActivity]);

  // filter notes when labels are changing
  const filteredNotes = useMemo(() => {
    const activeLabels = labels.filter((label) => label.isActive).map((label) => label.label);
    // filter out notes
    return getFilteredDecoratedNotes(allNotes, activeLabels);
  }, [allNotes, labels]);

  return [filteredNotes, labels, toggleLabel];
}
