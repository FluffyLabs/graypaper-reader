import { useRef } from "react";

interface ICodeStore {
  [key: string]: Promise<string[]>;
}

export function useCodeStore(texDirectory: string) {
  const storeRef = useRef<ICodeStore>({});

  const fetchFileAsText = async (url: string): Promise<string[]> => {
    try {
      const response = await fetch(url);
      return (await response.text()).split("\n");
    } catch (e) {
      console.error(`Failed to fetch file: ${url}.`, e);
    }

    return [];
  };

  return {
    async getByFilePath(path: string): Promise<string[]> {
      if (!(path in storeRef.current)) {
        storeRef.current[path] = fetchFileAsText(`${texDirectory}${path}`);
      }

      return storeRef.current[path];
    },
  };
}
