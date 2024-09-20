import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useCodeStore } from "./hooks/useCodeStore";

export interface ISynctexBlockId {
  pageNumber: number;
  index: number;
}

export interface ICodeSyncContext {
  getSynctexBlockAtLocation(left: number, top: number, pageNumber: number): ISynctexBlock | null;
  getSynctexBlockById(blockId: ISynctexBlockId): ISynctexBlock | null;
  getSynctexBlockRange(startBlockId: ISynctexBlockId, endBlockId: ISynctexBlockId): ISynctexBlock[];
  getSectionTitleAtSynctexBlock(blockId: ISynctexBlockId): Promise<string | null>;
  getSubsectionTitleAtSynctexBlock(blockId: ISynctexBlockId): Promise<string | null>;
}

interface ISynctexData {
  files: {
    [key: string]: string;
  };
  pages: {
    [key: string]: ISynctexBlock[];
  };
}

export interface ISynctexBlock extends ISynctexBlockId {
  fileId: number;
  line: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ICodeSyncProviderProps {
  synctexUrl: string;
  texDirectory: string;
  children: ReactNode;
}

const BLOCK_MATCHING_TOLERANCE_AS_FRACTION_OF_PAGE_WIDTH = 0.00375;
const BLOCK_MATCHING_TOLERANCE_AS_FRACTION_OF_PAGE_HEIGHT = 0.0025;
const LATEX_SECTION_PATTERN = /\\section{([^}]+)}/;
const LATEX_SUBSECTION_PATTERN = /\\subsection{([^}]+)}/;
const LATEX_BIBLIOGRAPHY_PATTERN = "\\printbibliography";
const BIBLIOGRAPHY_TITLE = "References";

export const CodeSyncContext = createContext<ICodeSyncContext | null>(null);

export function CodeSyncProvider({ synctexUrl, texDirectory, children }: ICodeSyncProviderProps) {
  const [synctexData, setSynctexData] = useState<ISynctexData>();
  const { getByFilePath } = useCodeStore(texDirectory);

  const getFilePathById = (id: number): string | null => {
    if (!synctexData) return null;

    return synctexData.files[id.toString()];
  };

  useEffect(() => {
    async function loadSynctex() {
      try {
        const response = await fetch(synctexUrl);
        const fromJson = (await response.json()) as ISynctexData;
        setSynctexData(fromJson);
      } catch (error) {
        console.error("Failed to load synctex data for this version.", error);
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

      for (let i = 0; i < blocksInCurrPage.length; i++) {
        const currBlock = blocksInCurrPage[i];
        if (
          left >= currBlock.left - BLOCK_MATCHING_TOLERANCE_AS_FRACTION_OF_PAGE_WIDTH &&
          left <= currBlock.left + currBlock.width + BLOCK_MATCHING_TOLERANCE_AS_FRACTION_OF_PAGE_WIDTH &&
          top >= currBlock.top - currBlock.height - BLOCK_MATCHING_TOLERANCE_AS_FRACTION_OF_PAGE_HEIGHT &&
          top <= currBlock.top + BLOCK_MATCHING_TOLERANCE_AS_FRACTION_OF_PAGE_HEIGHT
        ) {
          lastMatch = currBlock;
        }
      }

      return lastMatch || null;
    },
    getSynctexBlockById(blockId) {
      if (!synctexData) return null;

      try {
        return synctexData.pages[blockId.pageNumber][blockId.index];
      } catch (e) {
        console.warn(`Synctex block not found at page ${blockId.pageNumber} and index ${blockId.index}.`, e);
      }

      return null;
    },
    getSynctexBlockRange(startBlockId, endBlockId) {
      if (!synctexData || startBlockId.pageNumber !== endBlockId.pageNumber) return [];

      // todo: for now we assume selections are within one page
      return synctexData.pages[startBlockId.pageNumber].slice(startBlockId.index, endBlockId.index + 1);
    },
    async getSectionTitleAtSynctexBlock(blockId) {
      const block = context.getSynctexBlockById(blockId);

      if (!block) return null;

      const sourceFilePath = getFilePathById(block.fileId);

      if (!sourceFilePath) return null;

      const sourceFileLines = await getByFilePath(sourceFilePath);

      if (sourceFileLines[Math.max(block.line - 2, 0)].startsWith(LATEX_BIBLIOGRAPHY_PATTERN)) {
        return BIBLIOGRAPHY_TITLE;
      }

      for (let i = block.line - 1; i >= 0; i--) {
        const matches = sourceFileLines[i].match(LATEX_SECTION_PATTERN);

        if (matches) {
          return matches[1];
        }
      }

      return null;
    },
    async getSubsectionTitleAtSynctexBlock(blockId) {
      const block = context.getSynctexBlockById(blockId);

      if (!block) return null;

      const sourceFilePath = getFilePathById(block.fileId);

      if (!sourceFilePath) return null;

      const sourceFileLines = await getByFilePath(sourceFilePath);

      for (let i = block.line - 1; i >= 0; i--) {
        const matches = sourceFileLines[i].match(LATEX_SUBSECTION_PATTERN);

        if (matches) {
          return matches[1];
        }
      }

      return null;
    },
  };

  return <CodeSyncContext.Provider value={context}>{children}</CodeSyncContext.Provider>;
}
