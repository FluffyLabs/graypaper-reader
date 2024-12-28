import { useCallback, useEffect, useMemo, useState } from "react";
import type { IDecoratedNote } from "../types/DecoratedNote";

export type ILabel = {
  label: string;
  isActive: boolean;
};

/**
 * Maintains a list list of all labels (across all nodes) and allow to activate/deactivate them
 * to filter given list of all decorated notes.
 */
export function useLabels(allNotes: IDecoratedNote[]): [IDecoratedNote[], ILabel[], (label: string) => void] {
  const [labels, setLabels] = useState<ILabel[]>([]);

  // toggle label visibility
  const toggleLabel = useCallback((label: string) => {
    setLabels((labels) => {
      return labels.map((x) => {
        if (x.label === label) {
          x.isActive = !x.isActive;
        }
        return x;
      });
    });
  }, []);

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
        const oldLabelIdx = justNames.indexOf(label as string);
        if (oldLabelIdx === -1) {
          return { label: label as string, isActive: true };
        }
        return oldLabels[oldLabelIdx];
      });
    });
  }, [allNotes]);

  // filter notes when labels are changing
  const filteredNotes = useMemo(() => {
    // build a map
    const active = new Map<string, boolean>();
    labels.map((x) => active.set(x.label, x.isActive));

    // filter out notes
    return allNotes.filter((note) => {
      const activeLabels = note.original.labels.filter((label) => active.get(label));
      return activeLabels.length > 0;
    });
  }, [allNotes, labels]);

  return [filteredNotes, labels, toggleLabel];
}
