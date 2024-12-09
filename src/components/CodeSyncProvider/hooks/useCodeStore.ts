import { useContext, useMemo, useRef } from "react";
import { type ILocationContext, LocationContext } from "../../LocationProvider/LocationProvider";
import { type IMetadataContext, MetadataContext } from "../../MetadataProvider/MetadataProvider";

export function useCodeStore() {
  const cacheRef = useRef<Map<string, Promise<string>>>(new Map());
  const { locationParams } = useContext(LocationContext) as ILocationContext;
  const { urlGetters } = useContext(MetadataContext) as IMetadataContext;

  return useMemo(() => {
    const fetchAsString = async (url: string): Promise<string> => {
      try {
        const response = await fetch(url);
        return await response.text();
      } catch (e) {
        console.error(`Failed to fetch file: ${url}.`, e);
      }

      return "";
    };

    const fetchTex = async (path: string, version?: string): Promise<string> => {
      const texDirectory = urlGetters.texDirectory(version ?? locationParams.version);
      const versionedPath = `${texDirectory}/${path}`;

      if (!cacheRef.current.has(versionedPath)) cacheRef.current.set(versionedPath, fetchAsString(versionedPath));
      return cacheRef.current.get(versionedPath) as Promise<string>;
    };

    return {
      async getTexAsString(path: string, version?: string): Promise<string> {
        return fetchTex(path, version);
      },
      async getTexAsLines(path: string, version?: string): Promise<string[]> {
        return (await fetchTex(path, version)).split("\n");
      },
    };
  }, [locationParams.version, urlGetters]);
}
