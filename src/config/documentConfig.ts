export const DOC_CONFIG = {
  docId: import.meta.env.VITE_DOC_ID as string,
  docName: import.meta.env.VITE_DOC_NAME as string,
  metadataHost: import.meta.env.VITE_DOC_METADATA_HOST as string,
  readerDomain: import.meta.env.VITE_DOC_READER_DOMAIN as string,
  legacyReaderHost: (import.meta.env.VITE_DOC_LEGACY_READER_HOST as string) || null,
  pdfFilePrefix: import.meta.env.VITE_DOC_PDF_FILE_PREFIX as string,
  localStoragePrefix: import.meta.env.VITE_DOC_LOCAL_STORAGE_PREFIX as string,
  searchPlaceholder: import.meta.env.VITE_DOC_SEARCH_PLACEHOLDER as string,
  disclaimerSubject: import.meta.env.VITE_DOC_DISCLAIMER_SUBJECT as string,
} as const;

/** Prefix a localStorage key with the document ID to avoid cross-document collisions. */
export function lsKey(key: string): string {
  return `${DOC_CONFIG.localStoragePrefix}-${key}`;
}
