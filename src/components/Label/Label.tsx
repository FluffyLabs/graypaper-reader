import { LABEL_IMPORTED, LABEL_LOCAL, LABEL_REMOTE } from "../NotesProvider/consts/labels";
import { NoteSource } from "../NotesProvider/types/DecoratedNote";
import "./Label.css";
import { useMemo } from "react";

export function Label({ label, prefix = "" }: { label: string; prefix?: string }) {
  const backgroundColor = useMemo(() => labelToColor(label), [label]);
  return (
    <span style={{ backgroundColor }} className="label">
      {prefix} {label}
    </span>
  );
}

function labelToColor(label: string) {
  return getColor(hashStringToIndex(getLabelFromHierarchical(label)));
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

export function getHierarchicalLabel(label: string, source: NoteSource): string {
  if (label === LABEL_REMOTE || label === LABEL_LOCAL || label.startsWith(LABEL_IMPORTED)) {
    return label;
  }
  if (source === NoteSource.Remote) {
    return `${LABEL_REMOTE}/${label}`;
  }
  return `${LABEL_LOCAL}/${label}`;
}

export function getLabelFromHierarchical(hierarchicalLabel: string): string {
  if (hierarchicalLabel.startsWith(`${LABEL_LOCAL}/`) || hierarchicalLabel.startsWith(`${LABEL_REMOTE}/`)) {
    const parts = hierarchicalLabel.split("/");
    return parts.slice(1).join("/");
  }
  return hierarchicalLabel;
}
