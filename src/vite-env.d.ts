/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DOC_ID: string;
  readonly VITE_DOC_NAME: string;
  readonly VITE_DOC_BASE_PATH: string;
  readonly VITE_DOC_METADATA_HOST: string;
  readonly VITE_DOC_READER_DOMAIN: string;
  readonly VITE_DOC_LEGACY_READER_HOST: string;
  readonly VITE_DOC_PDF_FILE_PREFIX: string;
  readonly VITE_DOC_LOCAL_STORAGE_PREFIX: string;
  readonly VITE_DOC_SEARCH_PLACEHOLDER: string;
  readonly VITE_DOC_DISCLAIMER_SUBJECT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*?prefetch" {
  export default string;
}
