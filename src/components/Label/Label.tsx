import { type ReactNode, useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { contrast, hslColorToCss, hslToHex } from "./color-utils";

export function Label({
  label,
  endSlot,
  className = "",
  variant = "filled",
  showTooltip = false,
}: {
  label: string;
  endSlot?: ReactNode;
  className?: string;
  variant?: "filled" | "outlined";
  showTooltip?: boolean;
}) {
  const mainColor = useMemo(() => labelToColor(label), [label]);
  const contrastMainColor = useMemo(() => bestTextColor(mainColor.hex), [mainColor]);
  const dimmedMainColor = useMemo(() => dimColor(mainColor), [mainColor]);

  const style = useMemo(
    () => ({
      "--dark-bg-color": hslColorToCss(dimmedMainColor.dark),
      "--light-bg-color": hslColorToCss(dimmedMainColor.light),
      "--dark-text-color": variant === "filled" ? contrastMainColor : mainColor.hex,
      "--light-text-color": "#000000",
      border: variant === "filled" ? "1px solid transparent" : `1px solid ${mainColor.hex}`,
    }),
    [contrastMainColor, variant, mainColor, dimmedMainColor],
  );

  return (
    <span
      style={style}
      className={twMerge(
        "label truncate rounded-xl px-2.5 py-0.5 bg-[var(--light-bg-color)] dark:bg-[var(--dark-bg-color)] text-[var(--light-text-color)] dark:text-[var(--dark-text-color)]",
        className,
      )}
      title={showTooltip ? label : undefined}
    >
      <span>{label}</span>
      {endSlot}
    </span>
  );
}

function dimColor(mainColor: { hsl: [number, number, number] }) {
  const darkColor = [mainColor.hsl[0], mainColor.hsl[1] * 0.75, mainColor.hsl[2] / 5] as [number, number, number];
  const lightColor = [mainColor.hsl[0], 80, 90] as [number, number, number];
  return { dark: darkColor, light: lightColor };
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
