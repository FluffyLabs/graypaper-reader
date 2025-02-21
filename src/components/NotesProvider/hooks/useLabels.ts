import { useCallback, useEffect, useMemo, useState } from "react";
import { getHierarchicalLabel } from "../../Label/Label";
import { LABEL_IMPORTED, LABEL_LOCAL, LABEL_REMOTE } from "../consts/labels";
import type { IDecoratedNote } from "../types/DecoratedNote";
import { loadFromLocalStorage, saveToLocalStorage } from "../utils/labelsLocalStorage";

export type ILabel = {
  label: string;
  isActive: boolean;
};

/**
 * Filter out labels
 * @param labels - list of labels to filter
 * @param onlyNonEditable - if true, only non-editable labels are returned (like remote/local/imported:)
 * @returns
 */
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
  const toggleLabel = useCallback(
    (label: string) => {
      let parent: ILabel | null = null;
      const toggle = (x: ILabel): ILabel => {
        if (x.label === label) {
          parent = x;
          return {
            ...x,
            isActive: !x.isActive,
          };
        }
        if (x.label.startsWith(`${label}/`) || (parent?.label === LABEL_LOCAL && x.label.startsWith(LABEL_IMPORTED))) {
          return {
            ...x,
            isActive: !parent?.isActive,
          };
        }
        return x;
      };

      const newLabel = labels.find((x) => x.label === label) || null;

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

      // update displayed labels
      setLabels((labels) => {
        return labels.map(toggle);
      });
    },
    [labels],
  );

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
    const uniqueLabels = new Map<string, ILabel>();
    allNotes.map((note) => {
      note.original.labels.map((label) => {
        const hierarchicalLabel = getHierarchicalLabel(label, note.source);
        if (!uniqueLabels.has(hierarchicalLabel)) {
          uniqueLabels.set(hierarchicalLabel, {
            label: hierarchicalLabel,
            isActive: true,
          });
        }
      });
    });

    setLabels((oldLabels) => {
      const justNames = oldLabels.map((x) => x.label);
      return Array.from(uniqueLabels.values()).map((label) => {
        const oldLabelIdx = justNames.indexOf(label.label);
        const activeByDefault = label.label !== LABEL_REMOTE;
        const activeInStorage = storageActivity.get(label.label);
        const isActive = activeInStorage ?? activeByDefault;

        if (oldLabelIdx === -1) {
          return { label: label.label, isActive };
        }
        return oldLabels[oldLabelIdx];
      });
    });
  }, [allNotes, storageActivity]);

  // filter notes when labels are changing
  const filteredNotes = useMemo(() => {
    // build a map
    const active = new Map<string, boolean>();
    labels.map((x) => active.set(x.label, x.isActive));

    // filter out notes
    return allNotes.filter((note) => {
      const activeLabels = note.original.labels.filter((label) => {
        const hierarchicalLabel = getHierarchicalLabel(label, note.source);
        return active.get(hierarchicalLabel);
      });
      return activeLabels.length > 0;
    });
  }, [allNotes, labels]);

  return [filteredNotes, labels, toggleLabel];
}
