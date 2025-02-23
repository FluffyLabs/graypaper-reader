import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";

import "./Search.css";

export function Search({ query, setQuery }: { query: string; setQuery: (x: string) => void }) {
  return (
    <div className="search-wrapper">
      <input
        autoFocus
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 search the Gray Paper"
      />
      <SearchResults query={query} />
    </div>
  );
}

type Match = {
  count: number;
  pagesAndCount: PageResults[];
};

type PageResults = {
  pageIndex: number;
  firstMatchIndex: number;
  count: number;
};

type SearchResultsProps = {
  query: string;
};

function SearchResults({ query }: SearchResultsProps) {
  const { eventBus, findController, viewer, linkService } = useContext(PdfContext) as IPdfContext;
  const [isLoading, setIsLoading] = useState(false);
  const resetTimeout = useRef(0);
  const [matches, setMatches] = useState<Match>({
    count: 0,
    pagesAndCount: [],
  });
  const resetMatchesLater = useCallback(() => {
    setIsLoading(true);
    clearTimeout(resetTimeout.current);
    resetTimeout.current = setTimeout(() => {
      setMatches({ count: 0, pagesAndCount: [] });
      setIsLoading(false);
    }, 500) as unknown as number;
  }, []);

  const search = useCallback(
    (type: string, findPrev = false) => {
      if (!eventBus) {
        return;
      }

      eventBus.dispatch("find", {
        query,
        type,
        findPrevious: findPrev,
        highlightAll: true,
      });
    },
    [eventBus, query],
  );

  useEffect(() => {
    if (!eventBus) {
      return;
    }

    resetMatchesLater();
    search("");
  }, [search, resetMatchesLater, eventBus]);

  useEffect(() => {
    const pageMatches = findController?.pageMatches ?? [];
    if (!eventBus || !viewer) {
      return;
    }

    const updateMatches = () => {
      const count = pageMatches.reduce((sum, x) => sum + x.length, 0);
      const pagesAndCount = Array.from(pageMatches.entries())
        .filter((x) => x[1].length > 0)
        .map(
          (x) =>
            ({
              pageIndex: x[0],
              firstMatchIndex: x[1][0],
              count: x[1].length,
            }) as PageResults,
        );
      clearTimeout(resetTimeout.current);
      setIsLoading(false);
      setMatches({ count, pagesAndCount });
    };

    eventBus.on("updatefindmatchescount", updateMatches);
    return () => {
      eventBus.off("updatefindmatchescount", updateMatches);
    };
  }, [eventBus, findController, viewer]);

  const jumpToPage = useCallback(
    (res: PageResults) => {
      linkService?.goToPage(res.pageIndex + 1);
    },
    [linkService],
  );

  const handlePrev = useCallback(() => {
    search("again", true);
  }, [search]);

  const handleNext = useCallback(() => {
    search("again");
  }, [search]);

  const hasResults = matches.count > 0;

  return (
    <>
      <div className={`search-buttons ${isLoading ? "search-loading" : ""}`}>
        <button disabled={!hasResults} onClick={handlePrev}>
          ⬅️
        </button>
        <button disabled={!hasResults} onClick={handleNext}>
          ➡️
        </button>
      </div>
      <div className={`search-results ${isLoading ? "search-loading" : ""}`}>
        Found {matches.count} results on {matches.pagesAndCount.length} pages.
        <ul>
          {matches.pagesAndCount.map((res) => (
            <li key={res.pageIndex}>
              <a style={{ cursor: "pointer" }} onClick={() => jumpToPage(res)}>
                Page {res.pageIndex + 1} ({res.count} matches)
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
