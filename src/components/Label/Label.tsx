import { LABEL_LOCAL, LABEL_REMOTE } from "../NotesProvider/consts/labels";
import { type IDecoratedNote, NoteSource } from "../NotesProvider/types/DecoratedNote";
import type { IStorageNote } from "../NotesProvider/types/StorageNote";
import "./Label.css";
import { useMemo } from "react";

export type ILabel = {
  label: string;
  isActive: boolean;
  parent: ILabel | null;
  children: ILabel[]; // Zmieniono na tablicę
  notes: IDecoratedNote[];
};

export function generateLabelTree(notes: IDecoratedNote[]): ILabel[] {
  const local: ILabel = {
    label: LABEL_LOCAL,
    isActive: true,
    parent: null,
    children: [],
    notes: [],
  };
  const remote: ILabel = {
    label: LABEL_REMOTE,
    isActive: true,
    parent: null,
    children: [],
    notes: [],
  };

  function addToTree(labelPath: string[], note: IDecoratedNote, currentNode: ILabel) {
    if (labelPath.length === 0) {
      currentNode.notes.push(note);
      return;
    }

    const [head, ...rest] = labelPath;
    let childNode = currentNode.children.find((child) => child.label === head);
    if (!childNode) {
      childNode = {
        label: head,
        isActive: true,
        parent: currentNode,
        children: [],
        notes: [],
      };
      currentNode.children.push(childNode);
    }
    addToTree(rest, note, childNode);
  }

  for (const note of notes) {
    for (const label of note.original.labels) {
      const parts = label.trim().split("/");
      const root = note.source === NoteSource.Local ? local : remote;
      if (parts.length === 1) {
        if (parts[0] === LABEL_LOCAL || parts[0] === LABEL_REMOTE) {
          root.notes.push(note);
          continue;
        }
      }
      addToTree(parts, note, root);
    }
  }

  return [local, remote];
}

export function Label({ label, prefix = "" }: { label: string; prefix?: string }) {
  const backgroundColor = useMemo(() => labelToColor(label.split("/").pop() || ""), [label]);
  return (
    <span style={{ backgroundColor }} className="label">
      {prefix} {label}
    </span>
  );
}

function labelToColor(label: string) {
  return getColor(hashStringToIndex(label));
}

function getColor(index: number) {
  const size = 64;
  const hue = (index * (360 / size)) % 360;
  return hslToHex(hue, 90, 40);
}

// Function to hash a string to an index
function hashStringToIndex(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = hash * 31 + label.charCodeAt(i);
  }
  return hash;
}

function hslToHex(h: number, s: number, lightness: number) {
  const l = lightness / 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0"); // Convert to hex and pad if necessary
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function filterNotesByLabels(
  labels: ILabel[],
  { onlyInactive }: { onlyInactive: boolean } = { onlyInactive: true },
): IStorageNote[] {
  return filterDecoratedNotesByLabels(labels, { hasAllLabels: true, onlyInactive: onlyInactive }).map(
    (note) => note.original,
  );
}

export function filterDecoratedNotesByLabels(
  labels: ILabel[],
  { hasAllLabels, onlyInactive }: { hasAllLabels: boolean; onlyInactive: boolean } = {
    hasAllLabels: true,
    onlyInactive: false,
  },
): IDecoratedNote[] {
  const notesSet = new Set<IDecoratedNote>();
  const inactiveNotesSet = new Set<IDecoratedNote>();

  function traverseAndCollectNotes(label: ILabel, notes: Set<IDecoratedNote>, isActive = true) {
    if (label.isActive === isActive) {
      for (const note of label.notes) {
        notes.add(note);
      }
    }
    if (label.children) {
      for (const child of label.children) {
        traverseAndCollectNotes(child, notes, isActive);
      }
    }
  }

  if (onlyInactive) {
    for (const label of labels) {
      traverseAndCollectNotes(label, inactiveNotesSet, false);
    }
    return Array.from(inactiveNotesSet);
  }

  for (const label of labels) {
    traverseAndCollectNotes(label, notesSet);
  }
  if (hasAllLabels) {
    for (const label of labels) {
      traverseAndCollectNotes(label, inactiveNotesSet, false);
    }
    for (const note of inactiveNotesSet) {
      notesSet.delete(note);
    }
  }

  return Array.from(notesSet);
}

export function getFullLabelName(label: ILabel): string {
  let parentLabel = label.parent;
  let fullName = label.label;
  while (parentLabel) {
    fullName = `${parentLabel.label}/${fullName}`;
    parentLabel = parentLabel.parent;
  }
  return fullName;
}
