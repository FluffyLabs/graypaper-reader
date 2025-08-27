import type { UnPrefixedLabel } from "@fluffylabs/links-metadata";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LABEL_LOCAL, LABEL_REMOTE } from "../consts/labels";
import { type IDecoratedNote, NoteSource, isDecoratedNote } from "../types/DecoratedNote";
import type { IStorageNote } from "../types/StorageNote";
import { loadFromLocalStorage, saveToLocalStorage } from "../utils/labelsLocalStorage";

export type PrefixedLabel = string;

/** Label activity tracking (in local storage). */
export type IStorageLabel = {
  /** Label with source prefix added. (not renamed for backward compat)*/
  label: PrefixedLabel;
  isActive: boolean;
};

/** Enriched label type used to display label in the UI. */
export type ILabelTreeNode = {
  /** Label with source prefix added. */
  prefixedLabel: PrefixedLabel;
  isActive: boolean;
  /** Child labels. */
  children: ILabelTreeNode[];
};

export const HIERARCHY_SEPARATOR = "/";

export function prefixLabel(source: NoteSource, label: UnPrefixedLabel) {
  return [source === NoteSource.Local ? LABEL_LOCAL : LABEL_REMOTE, label].join(HIERARCHY_SEPARATOR);
}

/**
 * Fills a list of ILabels with parents (groups) of labels.
 * @param labels List of ILabels to build a tree from.
 * @returns A flat-semi-tree structure of labels (sorted alphabetically).
 */
export function buildLabelTree(labels: IStorageLabel[]): ILabelTreeNode[] {
  if (labels.length === 0) {
    return [];
  }

  const tree: ILabelTreeNode[] = [];
  const labelMap = new Map<PrefixedLabel, ILabelTreeNode>();

  function addToTree(label: IStorageLabel) {
    const treeLabel: ILabelTreeNode = {
      prefixedLabel: label.label,
      isActive: label.isActive,
      children: [],
    };

    if (!labelMap.has(treeLabel.prefixedLabel)) {
      labelMap.set(treeLabel.prefixedLabel, treeLabel);
      tree.push(treeLabel);
    }

    // add a child to it's parent or add the parent label.
    const parts = treeLabel.prefixedLabel.split(HIERARCHY_SEPARATOR).slice(0, -1);
    if (parts.length) {
      handleParent(parts.join(HIERARCHY_SEPARATOR), treeLabel);
    }

    return treeLabel;
  }

  function handleParent(parentLabel: PrefixedLabel, label: ILabelTreeNode) {
    let parent = labelMap.get(parentLabel);

    if (parent === undefined) {
      const newParent = {
        label: parentLabel,
        isActive: label.isActive,
      };
      parent = addToTree(newParent);
    }

    parent.children.push(label);
    parent.isActive = parent.children.some((x) => x.isActive);
  }

  for (const label of labels) {
    addToTree(label);
  }

  // sort labels alphabetically
  return tree.sort((a, b) => a.prefixedLabel.localeCompare(b.prefixedLabel));
}

/**
 * Filter notes based on labels.
 *
 * @param notes List of notes to filter.
 * @param labels List of source-prefixed labels to filter by.
 * @param includesLabel If true, returns notes that have any of the labels.
 *                      If false, returns notes that DO NOT have all the labels.
 * @returns Filtered list of notes.
 */
export function getFilteredNotes<T extends IStorageNote | IDecoratedNote>(
  notes: T[],
  labels: PrefixedLabel[],
  { includesLabel }: { includesLabel: boolean } = { includesLabel: true },
): T[] {
  const labelsSet = new Set(labels);
  return notes.filter((note) => {
    const labels = isDecoratedNote(note) ? note.original.labels : note.labels;
    const source = isDecoratedNote(note) ? note.source : NoteSource.Local;
    const hasSomeLabels = labels.some((label) => labelsSet.has(prefixLabel(source, label)));
    return includesLabel ? hasSomeLabels : !hasSomeLabels;
  });
}

const initialEmptyArray: unknown[] = [];

/**
 * Maintains a list list of all labels (across all nodes) and allow to activate/deactivate them
 * to filter given list of all decorated notes.
 */
export function useLabels(allNotes: IDecoratedNote[]): {
  filteredNotes: IDecoratedNote[];
  labels: ILabelTreeNode[];
  toggleLabel: (label: ILabelTreeNode) => void;
} {
  const [storageLabels, setStorageLabels] = useState<IStorageLabel[]>([]);
  const [labels, setLabels] = useState<ILabelTreeNode[]>(initialEmptyArray as ILabelTreeNode[]);

  // load and save storage labels to Local Storage
  useEffect(() => {
    const storageLabels = loadFromLocalStorage();
    setStorageLabels(storageLabels);
  }, []);

  useEffect(() => {
    if (storageLabels.length) {
      saveToLocalStorage(storageLabels);
    }
  }, [storageLabels]);

  // toggle label visibility
  const toggleLabel = useCallback((label: ILabelTreeNode) => {
    const setActivity = (x: ILabelTreeNode, isActive: boolean) => {
      x.isActive = isActive;
      // set children recursively
      x.children = x.children.map((x) => setActivity(x, isActive));
      return x;
    };

    const setActivityForMatchingLabel = (x: ILabelTreeNode) => {
      if (x.prefixedLabel === label.prefixedLabel) {
        setActivity(x, !label.isActive);
      }
      return x;
    };

    let changedLabel: ILabelTreeNode | null;
    // NOTE: this code does not update parent entries. We rely
    // on the tree being rebuilt in another hook which obviously
    // is a suboptimal.
    setLabels((labels) => {
      const newLabels = labels.map(setActivityForMatchingLabel);
      changedLabel = newLabels.find((x) => x.prefixedLabel === label.prefixedLabel) ?? null;
      return newLabels;
    });
    // NOTE: we update storage labels separately, since they may have more entries
    // than actually displayed labels.
    setStorageLabels((storageLabels) => {
      const toUpdate: ILabelTreeNode[] = changedLabel !== null ? [changedLabel] : [];
      let newStorageLabels = storageLabels;
      // update changed label and also all of it's children.
      for (;;) {
        const updatedLabel = toUpdate.pop();
        if (updatedLabel === undefined) {
          break;
        }
        const { prefixedLabel, isActive } = updatedLabel;
        // first update if the already existing item (we keep the same object to avoid re-rendering)
        const hasItem = newStorageLabels.some((x) => x.label === prefixedLabel);
        if (hasItem) {
          newStorageLabels = newStorageLabels.map((x) => (x.label === prefixedLabel ? { ...x, isActive } : x));
        } else {
          newStorageLabels = [...newStorageLabels, { label: prefixedLabel, isActive }];
        }
        // next process all of the children as well
        toUpdate.push(...updatedLabel.children);
      }
      return newStorageLabels;
    });
  }, []);

  // maintain a set of labels inactive in local storage.
  const storageActivity = useMemo(() => {
    const activity = new Map<PrefixedLabel, boolean>();
    for (const label of storageLabels) {
      activity.set(label.label, label.isActive);
    }

    return activity;
  }, [storageLabels]);

  // Re-build the labels tree on changes in notes or storage labels.
  useEffect(() => {
    const uniqueLabels = new Set<PrefixedLabel>();

    allNotes.map((note) => {
      note.original.labels.map((label) => {
        uniqueLabels.add(prefixLabel(note.source, label));
      });
    });

    setLabels((prev) => {
      if (prev.length === 0 && uniqueLabels.size === 0) {
        return prev;
      }

      return buildLabelTree(
        Array.from(uniqueLabels.values()).map((prefixedLabel) => {
          const activeByDefault = !prefixedLabel.startsWith(LABEL_REMOTE);
          const activeInStorage = storageActivity.get(prefixedLabel);
          const isActive = activeInStorage ?? activeByDefault;

          return {
            label: prefixedLabel,
            isActive,
          };
        }),
      );
    });
  }, [allNotes, storageActivity]);

  // filter notes when labels are changing
  const filteredNotes = useMemo(() => {
    const activeLabels = labels.filter((label) => label.isActive).map((label) => label.prefixedLabel);
    // filter out notes
    return getFilteredNotes(allNotes, activeLabels);
  }, [allNotes, labels]);

  return { filteredNotes, labels, toggleLabel };
}
