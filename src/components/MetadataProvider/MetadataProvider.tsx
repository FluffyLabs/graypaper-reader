import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { DOC_CONFIG } from "../../config/documentConfig";

const METADATA_HOST = DOC_CONFIG.metadataHost;
const METADATA_JSON = `${METADATA_HOST}/metadata.json`;
export const LEGACY_READER_HOST = DOC_CONFIG.legacyReaderHost;

export interface IVersionInfo {
  hash: string;
  date: string;
  name?: string;
  legacy?: boolean;
}

export interface IMetadata {
  latest: string;
  nightly?: IVersionInfo;
  versions: {
    [key: string]: IVersionInfo;
  };
}

export interface IMetadataContext {
  metadata: IMetadata;
  urlGetters: {
    pdf: (version: string) => string;
    md: (version: string) => string;
    synctex: (version: string) => string;
    texDirectory: (version: string) => string;
    legacyReaderRedirect: (hash: string) => string;
  };
}

interface IMetadataProviderProps {
  children: ReactNode;
}

export const MetadataContext = createContext<IMetadataContext | null>(null);

export const useMetadataContext = () => {
  const context = useContext(MetadataContext);
  if (!context) {
    throw new Error("useMetadataContext must be used within a MetadataProvider");
  }
  return context;
};

export function MetadataProvider({ children }: IMetadataProviderProps) {
  const [metadata, setMetadata] = useState<IMetadata>();

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setMetadata((await (await fetch(METADATA_JSON)).json()) as IMetadata);
      } catch (e) {
        console.error("Couldn't load metadata.", e);
      }
    };

    fetchMetadata();
  }, []);

  const context = useMemo<IMetadataContext | null>(() => {
    if (!metadata) return null;

    return {
      metadata,
      urlGetters: {
        pdf: (version) => `${METADATA_HOST}/${DOC_CONFIG.pdfFilePrefix}-${version}.pdf`,
        md: (version) => `${METADATA_HOST}/${DOC_CONFIG.pdfFilePrefix}-${version}.md`,
        synctex: (version) => `${METADATA_HOST}/${DOC_CONFIG.pdfFilePrefix}-${version}.synctex.json`,
        texDirectory: (version) => `${METADATA_HOST}/tex-${version}`,
        legacyReaderRedirect: (hash) => `${LEGACY_READER_HOST}/${hash}`,
      },
    };
  }, [metadata]);

  if (!context) {
    return null;
  }

  return <MetadataContext.Provider value={context}>{children}</MetadataContext.Provider>;
}
