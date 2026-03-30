import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useState } from "react";
import type { TOutlineComplete, TOutlineSingleSlim } from "./types";

type OutlineItemWithPage = {
  path: string;
  pageNumber: number; // 1-based
};

async function resolveDestToPage(
  pdfDocument: PDFDocumentProxy,
  dest: TOutlineSingleSlim["dest"],
): Promise<number | null> {
  try {
    let resolvedDest = dest;
    if (typeof dest === "string") {
      resolvedDest = await pdfDocument.getDestination(dest);
    }
    if (Array.isArray(resolvedDest) && resolvedDest[0]) {
      const pageIndex = await pdfDocument.getPageIndex(resolvedDest[0]);
      return pageIndex + 1; // convert to 1-based page number
    }
  } catch {
    // Expected: some destinations (e.g. invalid refs, skeleton items) cannot be resolved.
  }
  return null;
}

async function flattenOutlineWithPages(
  pdfDocument: PDFDocumentProxy,
  outline: TOutlineComplete,
): Promise<OutlineItemWithPage[]> {
  const result: OutlineItemWithPage[] = [];

  async function walk(items: TOutlineSingleSlim[], parentPath: string) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const path = parentPath ? `${parentPath}.${i}` : `${i}`;
      const pageNumber = await resolveDestToPage(pdfDocument, item.dest);
      if (pageNumber !== null) {
        result.push({ path, pageNumber });
      }
      if (item.items.length > 0) {
        await walk(item.items, path);
      }
    }
  }

  await walk(outline, "");
  return result;
}

export function useActiveOutlineItem(
  outline: TOutlineComplete | undefined,
  pdfDocument: PDFDocumentProxy | undefined,
  visiblePages: number[],
): string | null {
  const [itemsWithPages, setItemsWithPages] = useState<OutlineItemWithPage[]>([]);

  useEffect(() => {
    if (!outline || !pdfDocument) {
      setItemsWithPages([]);
      return;
    }

    let cancelled = false;
    flattenOutlineWithPages(pdfDocument, outline).then((items) => {
      if (!cancelled) {
        setItemsWithPages(items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [outline, pdfDocument]);

  if (itemsWithPages.length === 0 || visiblePages.length === 0) {
    return null;
  }

  const topVisiblePage = visiblePages[0];

  // itemsWithPages is in document order (produced by a depth-first walk of
  // the outline tree), so page numbers are non-decreasing.  We find the last
  // item whose page is <= the top visible page.
  let activePath: string | null = null;
  for (const item of itemsWithPages) {
    if (item.pageNumber <= topVisiblePage) {
      activePath = item.path;
    } else {
      break;
    }
  }

  return activePath;
}
