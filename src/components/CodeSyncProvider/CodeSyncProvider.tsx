import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
// import { useCodeStore } from "./hooks/useCodeStore";

export interface ICodeSyncContext {
  getSynctexBlockAtLocation(left: number, top: number, pageNumber: number): ISynctexBlock | null;
}

interface ISynctexData {
  files: {
    [key: string]: string;
  };
  pages: {
    [key: string]: ISynctexBlock[];
  };
}

export interface ISynctexBlock {
  fileId: number;
  line: number;
  left: number;
  top: number;
  width: number;
  height: number;
  id: string;
}

interface ICodeSyncProviderProps {
  synctexUrl: string;
  codeUrl: string;
  children: ReactNode;
}
// const ENTRY_POINT_FILE_PATH = "graypaper.tex";

const BLOCK_MATCHING_TOLERANCE_AS_FRACTION_OF_PAGE_WIDTH = 0.00375;
const BLOCK_MATCHING_TOLERANCE_AS_FRACTION_OF_PAGE_HEIGHT = 0.0025;

export const CodeSyncContext = createContext<ICodeSyncContext | null>(null);

export function CodeSyncProvider({ synctexUrl, /* codeUrl, */ children }: ICodeSyncProviderProps) {
  const [synctexData, setSynctexData] = useState<ISynctexData>();
  // const { getByFilePath } = useCodeStore(codeUrl);

  useEffect(() => {
    async function loadSynctex() {
      try {
        const response = await fetch(synctexUrl);
        const fromJson = (await response.json()) as ISynctexData;
        setSynctexData(fromJson);
      } catch (error) {
        console.error(error);
      }
    }

    if (synctexUrl) {
      loadSynctex();
    }
  }, [synctexUrl]);

  const context: ICodeSyncContext = {
    getSynctexBlockAtLocation(left, top, pageNumber) {
      if (!synctexData) return null;

      const blocksInCurrPage = synctexData.pages[pageNumber];

      let lastMatch: ISynctexBlock | null = null;
      const matches = [];

      for (let i = 0; i < blocksInCurrPage.length; i++) {
        const currBlock = blocksInCurrPage[i];
        if (
          left >= currBlock.left - BLOCK_MATCHING_TOLERANCE_AS_FRACTION_OF_PAGE_WIDTH &&
          left <= currBlock.left + currBlock.width + BLOCK_MATCHING_TOLERANCE_AS_FRACTION_OF_PAGE_WIDTH &&
          top >= currBlock.top - currBlock.height - BLOCK_MATCHING_TOLERANCE_AS_FRACTION_OF_PAGE_HEIGHT &&
          top <= currBlock.top + BLOCK_MATCHING_TOLERANCE_AS_FRACTION_OF_PAGE_HEIGHT
        ) {
          lastMatch = currBlock;
          matches.push(currBlock);
        }
      }

      return lastMatch || null;
    },
  };

  document.getSynctexBlockAtLocation = context.getSynctexBlockAtLocation;

  return <CodeSyncContext.Provider value={context}>{children}</CodeSyncContext.Provider>;
}
