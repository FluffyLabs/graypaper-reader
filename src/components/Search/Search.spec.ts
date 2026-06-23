import { describe, expect, it } from "vitest";
import { getMatchSummary } from "./Search";

describe("getMatchSummary", () => {
  it("summarizes page matches", () => {
    expect(getMatchSummary([[2, 8], [], [1]])).toEqual({
      count: 3,
      pagesAndCount: [
        { pageIndex: 0, firstMatchIndex: 2, count: 2 },
        { pageIndex: 2, firstMatchIndex: 1, count: 1 },
      ],
    });
  });

  it("ignores sparse and undefined page entries while pdf.js is still calculating matches", () => {
    const pageMatches: Array<number[] | undefined> = [];
    pageMatches[0] = [4];
    pageMatches[2] = undefined;
    pageMatches[4] = [1, 3, 5];

    expect(getMatchSummary(pageMatches)).toEqual({
      count: 4,
      pagesAndCount: [
        { pageIndex: 0, firstMatchIndex: 4, count: 1 },
        { pageIndex: 4, firstMatchIndex: 1, count: 3 },
      ],
    });
  });
});
