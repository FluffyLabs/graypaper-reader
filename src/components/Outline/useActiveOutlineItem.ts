import type { PDFDocumentProxy } from "pdfjs-dist";
import type { RefObject } from "react";
import { useEffect, useState } from "react";
import type { TOutlineComplete, TOutlineSingleSlim } from "./types";

type OutlineItemWithPage = {
  path: string;
  pageNumber: number; // 1-based
  topFraction: number; // 0 = top of page, 1 = bottom of page
};

/** Extract the y-coordinate from a resolved PDF destination array. */
function extractDestTop(dest: unknown[]): number | null {
  if (dest.length < 2) return null;
  const type = dest[1];
  if (typeof type !== "object" || type === null || !("name" in type)) return null;

  switch ((type as { name: string }).name) {
    case "XYZ":
      return typeof dest[3] === "number" ? dest[3] : null;
    case "FitH":
    case "FitBH":
      return typeof dest[2] === "number" ? dest[2] : null;
    default:
      return null; // Fit, FitV, FitB, FitBV, FitR — no useful top coordinate
  }
}

async function resolveDest(
  pdfDocument: PDFDocumentProxy,
  dest: TOutlineSingleSlim["dest"],
): Promise<{ pageNumber: number; topFraction: number } | null> {
  try {
    let resolvedDest = dest;
    if (typeof dest === "string") {
      resolvedDest = await pdfDocument.getDestination(dest);
    }
    if (!Array.isArray(resolvedDest) || !resolvedDest[0]) return null;

    const pageIndex = await pdfDocument.getPageIndex(resolvedDest[0]);
    const pageNumber = pageIndex + 1;

    const destTop = extractDestTop(resolvedDest);
    let topFraction = 0; // default: top of page
    if (destTop !== null) {
      const page = await pdfDocument.getPage(pageNumber);
      const pageHeight = page.getViewport({ scale: 1 }).height;
      topFraction = Math.max(0, Math.min(1, 1 - destTop / pageHeight));
    }

    return { pageNumber, topFraction };
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
      const resolved = await resolveDest(pdfDocument, item.dest);
      if (resolved) {
        result.push({ path, ...resolved });
      }
      if (item.items.length > 0) {
        await walk(item.items, path);
      }
    }
  }

  await walk(outline, "");
  return result;
}

/**
 * Find the last outline item whose absolute position in the scroll container
 * is at or above the current scroll position.
 *
 * itemsWithPages is in document order (depth-first walk of the outline tree),
 * so absolute positions are non-decreasing.
 */
function computeActivePath(
  itemsWithPages: OutlineItemWithPage[],
  scrollTop: number,
  pageOffsets: DOMRect[],
): string | null {
  let activePath: string | null = null;
  for (const item of itemsWithPages) {
    const pageRect = pageOffsets[item.pageNumber];
    if (!pageRect) continue;
    const itemAbsoluteTop = pageRect.y + item.topFraction * pageRect.height;
    if (itemAbsoluteTop <= scrollTop + 1) {
      // +1px tolerance for sub-pixel rounding
      activePath = item.path;
    } else {
      break;
    }
  }
  return activePath;
}

export function useActiveOutlineItem(
  outline: TOutlineComplete | undefined,
  pdfDocument: PDFDocumentProxy | undefined,
  scrollContainer: HTMLElement | undefined,
  pageOffsets: RefObject<DOMRect[]>,
): string | null {
  const [itemsWithPages, setItemsWithPages] = useState<OutlineItemWithPage[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);

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

  useEffect(() => {
    if (!scrollContainer || itemsWithPages.length === 0) {
      setActivePath(null);
      return;
    }

    const update = () => {
      setActivePath(computeActivePath(itemsWithPages, scrollContainer.scrollTop, pageOffsets.current));
    };

    update();
    scrollContainer.addEventListener("scroll", update, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", update);
  }, [scrollContainer, itemsWithPages, pageOffsets]);

  return activePath;
}
