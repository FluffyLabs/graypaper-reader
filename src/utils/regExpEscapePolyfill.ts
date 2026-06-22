/**
 * Polyfill for `RegExp.escape` (TC39 Stage 4, shipped in Chrome 136 / Node 24 / Safari 18.4).
 *
 * pdf.js' `PDFFindController` calls `RegExp.escape` while turning a search query into a regular
 * expression. On WebKit older than iOS/Safari 18.4 the method is missing, so any query containing
 * a special character or punctuation (hyphens, colons, parentheses — pervasive in the Gray Paper)
 * throws `TypeError: RegExp.escape is not a function`, which silently aborts the search and returns
 * 0 results (issue #446). Installing this polyfill before pdf.js runs restores search on those
 * browsers; on engines that already implement `RegExp.escape` natively it is a no-op.
 *
 * The implementation mirrors the specification (and matches the native output byte-for-byte).
 */

declare global {
  interface RegExpConstructor {
    escape?(value: string): string;
  }
}

// Characters with special meaning in a regular expression; escaped with a leading backslash.
const SYNTAX_CHARACTERS = new Set("^$\\.*+?()[]{}|");

// C0 control characters that have a dedicated single-letter escape sequence.
const CONTROL_ESCAPES = new Map<number, string>([
  [0x09, "\\t"],
  [0x0a, "\\n"],
  [0x0b, "\\v"],
  [0x0c, "\\f"],
  [0x0d, "\\r"],
]);

// Punctuators the spec escapes as a hex sequence so the result is safe to embed anywhere
// (e.g. inside or outside a character class).
const OTHER_PUNCTUATORS = new Set([",", "-", "=", "<", ">", "#", "&", "!", "%", ":", ";", "@", "~", "'", "`", '"']);

function isAsciiLetterOrDigit(codePoint: number): boolean {
  return (
    (codePoint >= 0x30 && codePoint <= 0x39) || // 0-9
    (codePoint >= 0x41 && codePoint <= 0x5a) || // A-Z
    (codePoint >= 0x61 && codePoint <= 0x7a) // a-z
  );
}

function hexEscape(codePoint: number): string {
  if (codePoint <= 0xff) {
    return `\\x${codePoint.toString(16).padStart(2, "0")}`;
  }
  if (codePoint <= 0xffff) {
    return `\\u${codePoint.toString(16).padStart(4, "0")}`;
  }
  return `\\u{${codePoint.toString(16)}}`;
}

function encodeForRegExpEscape(char: string, codePoint: number): string {
  if (SYNTAX_CHARACTERS.has(char) || char === "/") {
    return `\\${char}`;
  }
  if (char.length === 1 && codePoint >= 0xd800 && codePoint <= 0xdfff) {
    return hexEscape(codePoint);
  }
  const controlEscape = CONTROL_ESCAPES.get(codePoint);
  if (controlEscape !== undefined) {
    return controlEscape;
  }
  if (OTHER_PUNCTUATORS.has(char) || /\s/.test(char)) {
    return hexEscape(codePoint);
  }
  return char;
}

/** Spec-compliant standalone implementation of `RegExp.escape`. */
export function regExpEscape(value: string): string {
  if (typeof value !== "string") {
    throw new TypeError("RegExp.escape requires a string argument");
  }

  let result = "";
  let isFirst = true;
  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0;
    // Escape a leading ASCII letter/digit so the result can be safely concatenated after `\`.
    if (isFirst && isAsciiLetterOrDigit(codePoint)) {
      result += hexEscape(codePoint);
    } else {
      result += encodeForRegExpEscape(char, codePoint);
    }
    isFirst = false;
  }
  return result;
}

/** Define `RegExp.escape` from {@link regExpEscape} when the runtime lacks it. */
export function installRegExpEscapePolyfill(): void {
  if (typeof RegExp.escape !== "function") {
    RegExp.escape = regExpEscape;
  }
}
