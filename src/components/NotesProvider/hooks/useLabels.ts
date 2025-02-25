import { useCallback, useEffect, useMemo, useState } from "react";
import { type ILabel, filterDecoratedNotesByLabels, generateLabelTree, getFullLabelName } from "../../Label/Label";
import { LABEL_LOCAL, LABEL_REMOTE } from "../consts/labels";
import type { IDecoratedNote } from "../types/DecoratedNote";
import { loadFromLocalStorage, saveToLocalStorage } from "../utils/labelsLocalStorage";

const DEBUG = false;
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
    if (label === LABEL_LOCAL || label === LABEL_REMOTE) {
      return onlyNonEditable;
    }
    return !onlyNonEditable;
  });
}

/**
 * Maintains a list list of all labels (across all nodes) and allow to activate/deactivate them
 * to filter given list of all decorated notes.
 */
export function useLabels(allNotes: IDecoratedNote[]): [IDecoratedNote[], ILabel[], (label: ILabel) => void] {
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
    (label: ILabel) => {
      const labelFullPath = (label: ILabel): ILabel[] => {
        if (!label.parent) {
          return [label];
        }
        return [...labelFullPath(label.parent), label];
      };

      const labelFull = labelFullPath(label);
      if (DEBUG) console.log("labelFull", labelFull);
      let depth = 0;

      const updateLabels = (labels: ILabel[]): ILabel[] => {
        return labels.map((rootLabel) => {
          const updateChildren = (children?: ILabel[], isActive?: boolean): ILabel[] => {
            if (DEBUG) console.log("children", children);
            if (!children) {
              return [];
            }
            if (isActive !== undefined) {
              if (DEBUG) console.log("c: isActive !== undefined");
              return children.map((child) => {
                child.isActive = isActive;
                child.children = updateChildren(child.children, isActive);
                return child;
              });
            }
            return children.map((child) => {
              if (child.label === labelFull[depth].label) {
                if (DEBUG) console.log("c: child === label [depth]", child, labelFull[depth], depth);
                if (DEBUG) console.log("c: labelFull.length, depth", labelFull.length, depth);
                if (labelFull.length - 1 === depth) {
                  if (DEBUG) console.log("c: labelFull.length - 1 === depth");
                  child.isActive = !child.isActive;
                  child.children = updateChildren(child.children, child.isActive);
                } else {
                  depth++;
                  if (DEBUG) console.log("c: labelFull.length - 1 !== depth");
                  child.children = updateChildren(child.children);
                }
              }
              return child;
            });
          };

          if (rootLabel.label === labelFull[depth].label) {
            if (DEBUG) console.log("r: rootLabel === label [depth]", rootLabel, labelFull[depth], depth);
            if (DEBUG) console.log("r: labelFull.length, depth", labelFull.length, depth);
            if (labelFull.length - 1 === depth) {
              if (DEBUG) console.log("r: labelFull.length - 1 === depth");
              if (DEBUG) console.log("r: rootLabel.isActive", rootLabel.isActive);
              rootLabel.isActive = !rootLabel.isActive;
              if (DEBUG) console.log("r: rootLabel.isActive", rootLabel.isActive);
              rootLabel.children = updateChildren(rootLabel.children, rootLabel.isActive);
            } else {
              depth++;
              if (DEBUG) console.log("r: labelFull.length - 1 !== depth");
              rootLabel.children = updateChildren(rootLabel.children);
            }
          }
          return rootLabel;
        });
      };

      if (DEBUG) console.log("allLabels", labels);
      setLabels((labels) => updateLabels(labels));
      setStorageLabels((oldLabels) => {
        const labelFullName = getFullLabelName(label);
        const findLabelInTree = (labels: ILabel[], labelFullName: string): ILabel | undefined => {
          for (const label of labels) {
            if (getFullLabelName(label) === labelFullName) {
              return label;
            }
            const foundInChildren = findLabelInTree(label.children || [], labelFullName);
            if (foundInChildren) {
              return foundInChildren;
            }
          }
          return undefined;
        };

        const existingLabel = findLabelInTree(oldLabels, labelFullName);
        if (existingLabel) {
          updateLabels(oldLabels);
        }
        return oldLabels;
      });
    },
    [labels],
  );

  // maintain a set of labels inactive in local storage.
  const storageActivity = useMemo(() => {
    const result = new Map<string, boolean>();
    for (const label of storageLabels) {
      result.set(getFullLabelName(label), label.isActive);
    }
    return result;
  }, [storageLabels]);

  // Re-create labels on change in notes
  useEffect(() => {
    const newLabels = generateLabelTree(allNotes);
    const updateTree = (labels: ILabel[]): ILabel[] => {
      if (!labels) {
        return [];
      }
      return labels.map((label) => {
        const isActive = storageActivity.get(getFullLabelName(label));
        if (isActive !== undefined) {
          label.isActive = isActive;
        }
        label.children = updateTree(label.children);
        return label;
      });
    };
    updateTree(newLabels);
    setLabels(newLabels);
  }, [allNotes, storageActivity]);

  // filter notes when labels are changing
  const filteredNotes = useMemo(() => {
    console.log("filtering labels");
    return filterDecoratedNotesByLabels(labels);
  }, [labels]);

  return [filteredNotes, labels, toggleLabel];
}
