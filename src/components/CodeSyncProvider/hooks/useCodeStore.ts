import { useRef } from "react";

interface ICodeStore {
  [key: string]: string[];
}

export function useCodeStore(codeUrl: string) {
  const storeRef = useRef<ICodeStore>({});

  return {
    async getByFilePath(path: string): Promise<string[]> {
      if (!(path in storeRef.current)) {
        const response = await fetch(`${codeUrl}${path}`);
        storeRef.current[path] = (await response.text()).split("\n");
      }

      return storeRef.current[path];
    },
  };
}
