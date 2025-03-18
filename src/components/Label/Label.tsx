import { type PrefixedLabel, prefixLabel } from "../NotesProvider/hooks/useLabels";
import { NoteSource } from "../NotesProvider/types/DecoratedNote";
import type { UnPrefixedLabel } from "../NotesProvider/types/StorageNote";
import "./Label.css";
import { useMemo } from "react";

export function Label({ label, icon = "" }: { label: PrefixedLabel; icon?: string }) {
  const backgroundColor = useMemo(() => labelToColor(label), [label]);
  return (
    <span style={{ backgroundColor }} className="label">
      {icon} {label}
    </span>
  );
}

export function LabelString({ label, source = NoteSource.Local }: { label: UnPrefixedLabel; source?: NoteSource }) {
  return <Label label={prefixLabel(source, label)} />;
}

function labelToColor(label: string) {
  return getColor(hashStringToIndex(label));
}

function getColor(index: number) {
  const size = 120;
  const hue = (index * (360 / size)) % 360;
  return hslToHex(hue, 90, 40);
}

// Function to hash a string to an index
function hashStringToIndex(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 7 + 11 * label.charCodeAt(i)) % 2 ** 32;
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
