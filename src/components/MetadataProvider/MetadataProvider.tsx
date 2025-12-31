import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";

const METADATA_HOST = "https://gp.fluffylabs.dev";
const METADATA_JSON = `${METADATA_HOST}/metadata.json`;
export const LEGACY_READER_HOST = "https://old-graypaper.fluffylabs.dev";

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

    const resolveVersion = (version: string) => (version === metadata.nightly?.hash ? "nightly" : version);

    return {
      metadata,
      urlGetters: {
        pdf: (version) => `${METADATA_HOST}/graypaper-${resolveVersion(version)}.pdf`,
        synctex: (version) => `${METADATA_HOST}/graypaper-${resolveVersion(version)}.synctex.json`,
        texDirectory: (version) => `${METADATA_HOST}/tex-${resolveVersion(version)}`,
        legacyReaderRedirect: (hash) => `${LEGACY_READER_HOST}/${hash}`,
      },
    };
  }, [metadata]);

  if (!context) {
    return null;
  }

  return <MetadataContext.Provider value={context}>{children}</MetadataContext.Provider>;
}
