import type { ISynctexData, ISynctexJson } from "../../types";

export class SynctexStore {
  constructor(
    private readonly synctexUrlGetter: (version: string) => string,
    private readonly cache: Map<string, Promise<ISynctexData>>,
  ) {}

  private async fetchAndTransform(url: string): Promise<ISynctexData> {
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
  }

  private async fetchSynctex(version: string): Promise<ISynctexData> {
    const url = this.synctexUrlGetter(version);

    if (!this.cache.has(url)) this.cache.set(url, this.fetchAndTransform(url));
    return this.cache.get(url) as Promise<ISynctexData>;
  }

  getSynctex = async (version: string): Promise<ISynctexData> => {
    return this.fetchSynctex(version);
  };
}
