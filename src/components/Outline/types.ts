import type { PDFDocumentProxy } from "pdfjs-dist";

export type TOutlineComplete = Awaited<ReturnType<PDFDocumentProxy["getOutline"]>>;
export type TOutlineSingleSlim = Pick<TOutlineComplete[0], "title" | "dest" | "items">;
