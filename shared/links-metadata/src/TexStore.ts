import { texUrlGetter as defaultGetter } from "./metadata";

export class TexStore {
  constructor(
    private readonly texUrlGetter: (version: string) => string = defaultGetter,
    private readonly cache: Map<string, Promise<string>> = new Map(),
  ) {}

  private async fetchAsString(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      return await response.text();
    } catch (e) {
      console.error(`Failed to fetch file: ${url}.`, e);
    }

    return "";
  }

  private async fetchTex(path: string, version: string): Promise<string> {
    const texDirectory = this.texUrlGetter(version);
    const versionedPath = `${texDirectory}/${path}`;

    if (!this.cache.has(versionedPath)) this.cache.set(versionedPath, this.fetchAsString(versionedPath));
    return this.cache.get(versionedPath) as Promise<string>;
  }

  getTexAsString = async (path: string, version: string): Promise<string> => {
    return this.fetchTex(path, version);
  };

  getTexAsLines = async (path: string, version: string): Promise<string[]> => {
    return (await this.fetchTex(path, version)).split("\n");
  };
}
