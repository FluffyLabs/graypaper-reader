export function hslColorToCss(hsl: [number, number, number]) {
  return `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
}

function luminance(r: number, g: number, b: number) {
  const a = [r, g, b].map((v) => {
    const value = v / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function contrast(rgb1: number[], rgb2: number[]) {
  const lum1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function hslToHex(h: number, s: number, lightness: number) {
  // Coerce inputs to numbers to handle potential non-numeric inputs gracefully.
  // Although TypeScript types as 'number', this adds a layer of robustness.
  let hue = Number(h);
  let saturation = Number(s);
  let light = Number(lightness);

  // Clamp saturation and lightness into the [0, 100] range.
  saturation = Math.max(0, Math.min(100, saturation));
  light = Math.max(0, Math.min(100, light));

  // Normalize hue into the [0, 360) range.
  hue = ((hue % 360) + 360) % 360;

  const l = light / 100;
  const a = (saturation * Math.min(l, 1 - l)) / 100;

  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);

    // Guard against NaN values for 'color' by using a default of 0.
    // Then, round and convert to hex. Ensure the result is clamped to [0, 255].
    const roundedColor = Math.round(255 * (Number.isNaN(color) ? 0 : color));
    const clampedColor = Math.max(0, Math.min(255, roundedColor));

    return clampedColor.toString(16).padStart(2, "0"); // Convert to hex and pad if necessary
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
