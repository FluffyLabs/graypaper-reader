import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useCodeStore } from "./hooks/useCodeStore";

export interface ICodeSyncContext {
  getSourceLocationByCoordinates(left: number, top: number, pageNumber: number): ISourceLocation | null;
  getCoordinatesBySourceLocation(pageNumber: number, fileId: number, line: number): ISynctexBlock[];
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
}

interface ISourceLocation {
  fileId: number;
  line: number;
}

interface ICodeSyncProviderProps {
  synctexUrl: string;
  codeUrl: string;
  children: ReactNode;
}

const DOCUMENT_WIDTH_IN_SYNCTEX_UNITS = 39158297.17696512;
const DOCUMENT_HEIGHT_IN_SYNCTEX_UNITS = 55381020.29313637;
const ENTRY_POINT_FILE_PATH = "graypaper.tex";

export const CodeSyncContext = createContext<ICodeSyncContext | null>(null);

export function CodeSyncProvider({ synctexUrl, codeUrl, children }: ICodeSyncProviderProps) {
  const [synctexData, setSynctexData] = useState<ISynctexData>();
  const { getByFilePath } = useCodeStore(codeUrl);

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
    getSourceLocationByCoordinates(left, top, pageNumber) {
      if (!synctexData) return null;

      const withinPageLeft = left * DOCUMENT_WIDTH_IN_SYNCTEX_UNITS;
      const withinPageTop = top * DOCUMENT_HEIGHT_IN_SYNCTEX_UNITS;

      const blocksInCurrPage = synctexData.pages[pageNumber];

      let lastMatch: ISynctexBlock | null = null;

      for (let i = 0; i < blocksInCurrPage.length; i++) {
        const currBlock = blocksInCurrPage[i];
        if (
          withinPageLeft >= currBlock.left &&
          withinPageLeft <= currBlock.left + currBlock.width &&
          withinPageTop >= currBlock.top - currBlock.height &&
          withinPageTop <= currBlock.top
        ) {
          lastMatch = currBlock;
        }
      }

      return lastMatch
        ? {
            fileId: lastMatch.fileId,
            line: lastMatch.line,
          }
        : null;
    },
    getCoordinatesBySourceLocation(pageNumber, fileId, line) {
      if (!synctexData) return [];

      return synctexData.pages[pageNumber]
        .filter((block) => block.fileId === fileId && block.line === line)
        .map((block) => ({
          ...block,
          left: block.left / DOCUMENT_WIDTH_IN_SYNCTEX_UNITS,
          top: block.top / DOCUMENT_HEIGHT_IN_SYNCTEX_UNITS,
          width: block.width / DOCUMENT_WIDTH_IN_SYNCTEX_UNITS,
          height: block.height / DOCUMENT_HEIGHT_IN_SYNCTEX_UNITS,
        }));
    },
  };

  return <CodeSyncContext.Provider value={context}>{children}</CodeSyncContext.Provider>;
}
