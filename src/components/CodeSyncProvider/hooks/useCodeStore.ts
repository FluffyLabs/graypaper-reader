import { useContext, useRef } from "react";
import { type ILocationContext, LocationContext } from "../../LocationProvider/LocationProvider";
import { type IMetadataContext, MetadataContext } from "../../MetadataProvider/MetadataProvider";
import type { ISynctexData } from "@graypaper-reader/types";

export function useCodeStore() {
  const cacheRef = useRef<Map<string, Promise<string>>>(new Map());
  const { locationParams } = useContext(LocationContext) as ILocationContext;
  const { urlGetters } = useContext(MetadataContext) as IMetadataContext;

  const fetchFileAsText = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      return await response.text();
    } catch (e) {
      console.error(`Failed to fetch file: ${url}.`, e);
    }

    return "";
  };

  const fetchAndCache = async (path: string): Promise<string> => {
    if (!cacheRef.current.has(path)) cacheRef.current.set(path, fetchFileAsText(path));
    return cacheRef.current.get(path) as Promise<string>;
  };

  const fetchTex = async (path: string, version?: string): Promise<string> => {
    const texDirectory = urlGetters.texDirectory(version ?? locationParams.version);
    const versionedPath = `${texDirectory}/${path}`;

    return fetchAndCache(versionedPath);
  };

  const fetchSynctex = async (version: string): Promise<string> => {
    const synctexUrl = urlGetters.synctex(version);

    return fetchAndCache(synctexUrl);
  };

  return {
    async getTexAsString(path: string, version?: string): Promise<string> {
      return fetchTex(path, version);
    },
    async getTexAsLines(path: string, version?: string): Promise<string[]> {
      return (await fetchTex(path, version)).split("\n");
    },
    async getSynctex(version: string): Promise<ISynctexData> {
      return JSON.parse(await fetchSynctex(version)) as ISynctexData;
    },
  };
}
