import type { ISynctexData, ISynctexJson } from "@fluffylabs/types";
import { useContext, useMemo, useRef } from "react";
import { type IMetadataContext, MetadataContext } from "../../MetadataProvider/MetadataProvider";

export function useSynctexStore() {
  const cacheRef = useRef<Map<string, Promise<ISynctexData>>>(new Map());
  const { urlGetters } = useContext(MetadataContext) as IMetadataContext;

  return useMemo(() => {
    const fetchAndTransform = async (url: string): Promise<ISynctexData> => {
      try {
        const response = await fetch(url);
        const json = (await response.json()) as ISynctexJson;

        return {
          filePathsByFileId: new Map(
            Object.entries(json.files).map(([fileId, filePath]) => [Number.parseInt(fileId), filePath]),
          ),
          blocksByPage: new Map(
            Object.entries(json.pages).map(([pageNumber, blocks]) => [Number.parseInt(pageNumber), blocks]),
          ),
          blocksByFileIdAndLine: Object.values(json.pages).reduce((acc, blocksInPage) => {
            for (const block of blocksInPage) {
              if (!acc.has(block.fileId)) acc.set(block.fileId, new Map());
              if (!acc.get(block.fileId)?.has(block.line)) acc.get(block.fileId)?.set(block.line, []);
              acc.get(block.fileId)?.get(block.line)?.push(block);
            }

            return acc;
          }, new Map()),
        };
      } catch (e) {
        console.error(`Failed to fetch file: ${url}.`, e);
      }

      return {} as ISynctexData;
    };

    const fetchSynctex = async (version: string): Promise<ISynctexData> => {
      const url = urlGetters.synctex(version);

      if (!cacheRef.current.has(url)) cacheRef.current.set(url, fetchAndTransform(url));
      return cacheRef.current.get(url) as Promise<ISynctexData>;
    };

    return {
      async getSynctex(version: string): Promise<ISynctexData> {
        return fetchSynctex(version);
      },
    };
  }, [urlGetters]);
}
