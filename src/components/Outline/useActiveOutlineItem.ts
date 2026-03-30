import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useState } from "react";
import type { TOutlineComplete, TOutlineSingleSlim } from "./types";

type OutlineItemWithPage = {
  title: string;
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
    // destination could not be resolved
  }
  return null;
}

async function flattenOutlineWithPages(
  pdfDocument: PDFDocumentProxy,
  outline: TOutlineComplete,
): Promise<OutlineItemWithPage[]> {
  const result: OutlineItemWithPage[] = [];

  async function walk(items: TOutlineSingleSlim[]) {
    for (const item of items) {
      const pageNumber = await resolveDestToPage(pdfDocument, item.dest);
      if (pageNumber !== null) {
        result.push({ title: item.title, pageNumber });
      }
      if (item.items.length > 0) {
        await walk(item.items);
      }
    }
  }

  await walk(outline);
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
    flattenOutlineWithPages(pdfDocument, outline).then(setItemsWithPages);
  }, [outline, pdfDocument]);

  if (itemsWithPages.length === 0 || visiblePages.length === 0) {
    return null;
  }

  const topVisiblePage = visiblePages[0];

  // Find the last outline item whose page is <= the top visible page.
  let activeTitle: string | null = null;
  for (const item of itemsWithPages) {
    if (item.pageNumber <= topVisiblePage) {
      activeTitle = item.title;
    } else {
      break;
    }
  }

  return activeTitle;
}
