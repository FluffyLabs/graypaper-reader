import { type ReactNode, createContext, useEffect, useState } from "react";

const METADATA_HOST = "";
const METADATA_JSON = `${METADATA_HOST}/metadata.json`;
const LEGACY_READER_HOST = "https://old-graypaper.fluffylabs.dev"; // todo: replace with actual url

export interface IVersionInfo {
  hash: string;
  date: string;
  name?: string;
  legacy?: boolean;
}

export interface IMetadata {
  latest: string;
  versions: {
    [key: string]: IVersionInfo;
  };
}

export interface IMetadataContext {
  metadata: IMetadata;
  urlGetters: {
    pdf: (version: string) => string;
    synctex: (version: string) => string;
    texDirectory: (version: string) => string;
    legacyReaderVersion: (version: string) => string;
    legacyReaderRedirect: (hash: string) => string;
  };
}

interface IMetadataProviderProps {
  children: ReactNode;
}

export const MetadataContext = createContext<IMetadataContext | null>(null);

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

  if (!metadata) return null;

  const context: IMetadataContext = {
    metadata,
    urlGetters: {
      pdf: (version) => `${METADATA_HOST}/graypaper-${version}.pdf`,
      synctex: (version) => `${METADATA_HOST}/graypaper-${version}.synctex.json`,
      texDirectory: (version) => `${METADATA_HOST}/tex-${version}/`,
      legacyReaderVersion: (version) => {
        const encodedParam = btoa(unescape(encodeURIComponent(JSON.stringify([version.substr(0, 10)]))));
        return `${LEGACY_READER_HOST}/#${encodedParam}`;
      },
      legacyReaderRedirect: (hash) => {
        return `${LEGACY_READER_HOST}/${hash}`;
      },
    },
  };

  return <MetadataContext.Provider value={context}>{children}</MetadataContext.Provider>;
}
