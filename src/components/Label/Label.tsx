import { type PrefixedLabel, prefixLabel } from "../NotesProvider/hooks/useLabels";
import { NoteSource } from "../NotesProvider/types/DecoratedNote";
import type { UnPrefixedLabel } from "../NotesProvider/types/StorageNote";
import "./Label.css";
import { useMemo } from "react";

export function Label({ label, icon = "", className }: { label: PrefixedLabel; icon?: string; className?: string }) {
  const backgroundColor = useMemo(() => labelToColor(label), [label]);
  const contrastColor = useMemo(() => bestTextColor(backgroundColor), [backgroundColor]);

  return (
    <span style={{ backgroundColor, color: contrastColor }} className={`label truncate ${className}`}>
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

function luminance(r: number, g: number, b: number) {
  const a = [r, g, b].map((v) => {
    const value = v / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrast(rgb1: number[], rgb2: number[]) {
  const lum1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function bestTextColor(bgHex: string) {
  const bg = [
    Number.parseInt(bgHex.slice(1, 3), 16),
    Number.parseInt(bgHex.slice(3, 5), 16),
    Number.parseInt(bgHex.slice(5, 7), 16),
  ];

  const whiteContrast = contrast(bg, [255, 255, 255]);
  const blackContrast = contrast(bg, [0, 0, 0]);

  return whiteContrast > blackContrast ? "#FFFFFF" : "#000000";
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
