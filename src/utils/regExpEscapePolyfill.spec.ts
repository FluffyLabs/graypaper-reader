import { afterEach, describe, expect, it } from "vitest";
import { installRegExpEscapePolyfill, regExpEscape } from "./regExpEscapePolyfill";

/**
 * `RegExp.escape` (TC39, shipped in Chrome 136 / Node 24 / Safari 18.4) is used internally by
 * pdf.js' `PDFFindController`. On older WebKit (iOS < 18.4) it is missing, so searching any term
 * with punctuation throws `TypeError: RegExp.escape is not a function` and the Gray Paper search
 * returns 0 results (issue #446). These tests pin a spec-accurate polyfill.
 *
 * The expected values below are the exact outputs of the native `RegExp.escape`, captured from
 * Node 24, so the polyfill is byte-for-byte compatible with the platform implementation.
 */

// [input, native RegExp.escape output]
const ORACLE: [string, string][] = [
  ["", ""],
  // syntax characters -> backslash escaped
  ["(", "\\("],
  [")", "\\)"],
  ["+", "\\+"],
  ["^", "\\^"],
  ["$", "\\$"],
  ["|", "\\|"],
  [".", "\\."],
  ["*", "\\*"],
  ["?", "\\?"],
  ["[", "\\["],
  ["]", "\\]"],
  ["{", "\\{"],
  ["}", "\\}"],
  ["\\", "\\\\"],
  ["/", "\\/"],
  // other punctuators / whitespace -> \xHH hex escaped
  ["-", "\\x2d"],
  [":", "\\x3a"],
  ["=", "\\x3d"],
  ["<", "\\x3c"],
  [">", "\\x3e"],
  ["#", "\\x23"],
  ["&", "\\x26"],
  ["!", "\\x21"],
  ["%", "\\x25"],
  [";", "\\x3b"],
  ["@", "\\x40"],
  ["~", "\\x7e"],
  [" ", "\\x20"],
  ["\u00a0", "\\xa0"],
  ["\u2028", "\\u2028"],
  // control escapes
  ["\t", "\\t"],
  // first code point that is an ASCII letter/digit -> \xHH, the rest left as-is
  ["abc", "\\x61bc"],
  ["0a", "\\x30a"],
  ["a0", "\\x610"],
  // multi-char punctuation runs (what pdf.js passes for `\p{P}+`)
  ["()", "\\(\\)"],
  ["--", "\\x2d\\x2d"],
  // realistic Gray Paper search terms (the ones that break on iOS < 18.4)
  ["a-b", "\\x61\\x2db"],
  ["JAM:", "\\x4aAM\\x3a"],
  ["work-report", "\\x77ork\\x2dreport"],
  ["(x)", "\\(x\\)"],
  // non-ASCII letters and astral code points are left untouched
  ["café-x", "\\x63afé\\x2dx"],
  ["é", "é"],
  ["😀", "😀"],
  // lone surrogates are escaped, while valid surrogate pairs are preserved as code points
  ["\ud800", "\\ud800"],
  ["\udc00", "\\udc00"],
];

describe("regExpEscape", () => {
  it.each(ORACLE)("escapes %j exactly like native RegExp.escape", (input, expected) => {
    expect(regExpEscape(input)).toBe(expected);
  });

  it("produces a pattern that matches the original literal", () => {
    for (const term of ["join-accumulate", "JAM:", "(x)", "a+b", "^foo$", "c.d", "100%", "x|y"]) {
      expect(new RegExp(regExpEscape(term)).test(term)).toBe(true);
    }
  });

  it("escapes regex metacharacters so they do not match as wildcards", () => {
    expect(new RegExp(regExpEscape("a.c")).test("axc")).toBe(false);
    expect(new RegExp(regExpEscape("a+")).test("aaa")).toBe(false);
  });

  it("throws a TypeError for non-string input, like native", () => {
    // @ts-expect-error intentionally passing a non-string
    expect(() => regExpEscape(123)).toThrow(TypeError);
  });
});

describe("installRegExpEscapePolyfill", () => {
  const original = RegExp.escape;

  afterEach(() => {
    RegExp.escape = original;
  });

  it("installs RegExp.escape when it is missing", () => {
    RegExp.escape = undefined; // simulate iOS Safari < 18.4
    installRegExpEscapePolyfill();

    expect(typeof RegExp.escape).toBe("function");
    // installs the thoroughly-tested implementation from this module
    expect(RegExp.escape).toBe(regExpEscape);
  });

  it("does not overwrite an existing (native) RegExp.escape", () => {
    const sentinel = (s: string) => `sentinel:${s}`;
    RegExp.escape = sentinel;
    installRegExpEscapePolyfill();

    expect(RegExp.escape).toBe(sentinel);
  });
});
