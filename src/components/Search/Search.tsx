import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DOC_CONFIG } from "../../config/documentConfig";
import { useKeyboardShortcut } from "../../hooks/useKeyboardShortcut";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";

import "./Search.css";
import { Button, ButtonGroup, Input } from "@fluffylabs/shared-ui";
import { twMerge } from "tailwind-merge";
import { useTabsContext } from "../Tabs/Tabs";

export function Search({
  onSearchFinished,
  tabName,
  className,
}: {
  tabName: string;
  onSearchFinished: (hasQuery: boolean) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { activeTab } = useTabsContext();
  const { locationParams } = useContext(LocationContext) as ILocationContext;
  const [query, setQuery] = useState("");
  // search query is persistent between tab switches
  // and we also handle search input from URL.
  const search = locationParams.search;
  useEffect(() => {
    if (search) {
      setQuery(search);
    } else {
      onSearchFinished(false);
    }
  }, [search, onSearchFinished]);

  useEffect(() => {
    if (activeTab === tabName) {
      inputRef.current?.focus();
    }
  }, [activeTab, tabName]);

  useKeyboardShortcut({
    key: "s",
    onKeyPress: () => inputRef.current?.focus(),
    enabled: activeTab === tabName,
  });

  return (
    <div className={twMerge("search-wrapper w-full", className)}>
      <Input
        ref={inputRef}
        autoFocus
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`🔍 press 's' to ${DOC_CONFIG.searchPlaceholder}`}
      />
      <SearchResults query={query} onSearchFinished={onSearchFinished} />
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

type SectionResults = {
  title: string;
  totalCount: number;
  firstPage: PageResults;
};

function usePageSectionMap(pdfDocument: PDFDocumentProxy | undefined): Map<number, string> {
  const [sectionMap, setSectionMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    if (!pdfDocument) {
      return;
    }

    let cancelled = false;
    const doc = pdfDocument;

    async function buildMap() {
      const outline = await doc.getOutline();
      if (!outline || cancelled) return;

      const sections: { title: string; pageIndex: number }[] = [];
      for (const item of outline) {
        let resolvedDest = item.dest;
        if (typeof resolvedDest === "string") {
          resolvedDest = await doc.getDestination(resolvedDest);
        }
        if (!Array.isArray(resolvedDest) || !resolvedDest[0]) continue;

        try {
          const pageIndex = await doc.getPageIndex(resolvedDest[0]);
          sections.push({ title: item.title, pageIndex });
        } catch {
          // Skip unresolvable destinations
        }
      }

      if (cancelled) return;

      sections.sort((a, b) => a.pageIndex - b.pageIndex);

      const numPages = doc.numPages;
      const map = new Map<number, string>();
      let currentSectionTitle: string | undefined;
      let nextSection = 0;
      for (let pageIndex = 0; pageIndex < numPages; pageIndex++) {
        while (nextSection < sections.length && sections[nextSection].pageIndex <= pageIndex) {
          currentSectionTitle = sections[nextSection].title;
          nextSection += 1;
        }
        if (currentSectionTitle) {
          map.set(pageIndex, currentSectionTitle);
        }
      }

      setSectionMap(map);
    }

    buildMap();
    return () => {
      cancelled = true;
    };
  }, [pdfDocument]);

  return sectionMap;
}

type SearchResultsProps = {
  query: string;
  onSearchFinished: (hasQuery: boolean) => void;
};

function SearchResults({ query, onSearchFinished }: SearchResultsProps) {
  const { eventBus, findController, viewer, linkService, pdfDocument } = useContext(PdfContext) as IPdfContext;
  const [isLoading, setIsLoading] = useState(false);
  const resetTimeout = useRef(0);
  const [matches, setMatches] = useState<Match>({
    count: 0,
    pagesAndCount: [],
  });
  const [currentMatch, setCurrentMatch] = useState(0);

  const pageSectionMap = usePageSectionMap(pdfDocument);

  const sectionResults = useMemo(() => {
    const grouped = new Map<string, SectionResults>();
    for (const res of matches.pagesAndCount) {
      const sectionTitle = pageSectionMap.get(res.pageIndex) ?? `Page ${res.pageIndex + 1}`;
      const existing = grouped.get(sectionTitle);
      if (existing) {
        existing.totalCount += res.count;
      } else {
        grouped.set(sectionTitle, { title: sectionTitle, totalCount: res.count, firstPage: res });
      }
    }
    return Array.from(grouped.values());
  }, [matches.pagesAndCount, pageSectionMap]);

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
        .filter((x) => x.length > 0 && x[1].length > 0)
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
      onSearchFinished(true);
    };

    const updateCurrentMatch = (evt: { matchesCount?: { current: number; total: number } }) => {
      setCurrentMatch(evt.matchesCount?.current ?? 0);
    };

    eventBus.on("updatefindmatchescount", updateMatches);
    eventBus.on("updatefindmatchescount", updateCurrentMatch);
    eventBus.on("updatefindcontrolstate", updateCurrentMatch);
    return () => {
      eventBus.off("updatefindmatchescount", updateMatches);
      eventBus.off("updatefindmatchescount", updateCurrentMatch);
      eventBus.off("updatefindcontrolstate", updateCurrentMatch);
    };
  }, [eventBus, findController, viewer, onSearchFinished]);

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
        <ButtonGroup className="w-full">
          <Button className="flex-1" variant="tertiary" disabled={!hasResults} onClick={handlePrev}>
            ⬅️ Previous
          </Button>
          <span className="flex items-center justify-center px-3 text-sm text-sidebar-foreground w-[7ch]">
            {hasResults ? `${currentMatch}/${matches.count}` : "0/0"}
          </span>
          <Button className="flex-1" variant="tertiary" disabled={!hasResults} onClick={handleNext}>
            Next ➡️
          </Button>
        </ButtonGroup>
      </div>
      <div className={`search-results text-sidebar-foreground ${isLoading ? "search-loading" : ""}`}>
        <ul>
          {sectionResults.map((section) => (
            <li key={section.title}>
              <a className="default-link" style={{ cursor: "pointer" }} onClick={() => jumpToPage(section.firstPage)}>
                {section.title}
              </a>{" "}
              ({section.totalCount} {section.totalCount === 1 ? "match" : "matches"})
            </li>
          ))}
        </ul>
        <br />
        Found {matches.count} results in {sectionResults.length} sections.
      </div>
    </>
  );
}
