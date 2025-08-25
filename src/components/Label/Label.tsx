import { type PrefixedLabel, prefixLabel } from "../NotesProvider/hooks/useLabels";
import { NoteSource } from "../NotesProvider/types/DecoratedNote";
import type { UnPrefixedLabel } from "../NotesProvider/types/StorageNote";
import { contrast, hslColorToCss, hslToHex } from "./color-utils";
import "./Label.css";
import { useMemo } from "react";

export function Label({
  label,
  icon = "",
  className,
  variant = "filled",
  showTooltip = false,
}: {
  label: PrefixedLabel;
  icon?: string;
  className?: string;
  variant?: "filled" | "outlined";
  showTooltip?: boolean;
}) {
  const mainColor = useMemo(() => labelToColor(label), [label]);
  const contrastMainColor = useMemo(() => bestTextColor(mainColor.hex), [mainColor]);
  const dimmedMainColor = useMemo(() => dimColor(mainColor), [mainColor]);

  const style = useMemo(
    () => ({
      backgroundColor: variant === "filled" ? mainColor.hex : hslColorToCss(dimmedMainColor.hsl),
      color: variant === "filled" ? contrastMainColor : mainColor.hex,
      border: variant === "filled" ? "1px solid transparent" : `1px solid ${mainColor.hex}`,
    }),
    [dimmedMainColor, contrastMainColor, variant, mainColor],
  );

  return (
    <span
      style={style}
      className={`label truncate ${className} rounded-xl px-2.5 py-0.5`}
      title={showTooltip ? label : undefined}
    >
      {icon} {label}
    </span>
  );
}

export function LabelString({ label, source = NoteSource.Local }: { label: UnPrefixedLabel; source?: NoteSource }) {
  return <Label label={prefixLabel(source, label)} />;
}

function dimColor(mainColor: { hsl: [number, number, number] }) {
  const newDimmedSaturation = mainColor.hsl[1] * 0.75;
  const newDimmedLightness = mainColor.hsl[2] / 5;
  const newHsl = [mainColor.hsl[0], newDimmedSaturation, newDimmedLightness] as [number, number, number];
  return { hsl: newHsl };
}

function bestTextColor(bgHex: string) {
  const bg = [
    Number.parseInt(bgHex.slice(1, 3), 16),
    Number.parseInt(bgHex.slice(3, 5), 16),
    Number.parseInt(bgHex.slice(5, 7), 16),
  ];

  const whiteContrast = contrast(bg, [255, 255, 255]);
  const blackContrast = contrast(bg, [0, 0, 0]);

  return whiteContrast > blackContrast ? "#E0E0E0" : "#000000";
}

function labelToColor(label: string) {
  return getColor(hashStringToIndex(label));
}

function hashStringToIndex(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 7 + 11 * label.charCodeAt(i)) % 2 ** 32;
  }
  return hash;
}

function getColor(index: number) {
  const size = 120;
  const hue = (index * (360 / size)) % 360;
  const hsl = [hue, 80, 65] as [number, number, number];
  const hex = hslToHex(hsl[0], hsl[1], hsl[2]);
  return { hsl, hex };
}
