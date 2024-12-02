import { createContext, useContext, useEffect, useState } from "react";
import type { PropsWithChildren, ReactNode } from "react";
import { useCodeStore } from "./hooks/useCodeStore";
import type { ISelectionParams, ISynctexBlock, ISynctexBlockId, ISynctexData } from "@graypaper-reader/types";
import { IMetadataContext, MetadataContext } from "../MetadataProvider/MetadataProvider";
import { ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { migrateSelection } from "@graypaper-reader/migrate-selection";

export interface ICodeSyncContext {
  getSynctexBlockAtLocation(left: number, top: number, pageNumber: number): ISynctexBlock | null;
  getSynctexBlockById(blockId: ISynctexBlockId): ISynctexBlock | null;
  getSynctexBlockRange(startBlockId: ISynctexBlockId, endBlockId: ISynctexBlockId): ISynctexBlock[];
  getSectionTitleAtSynctexBlock(blockId: ISynctexBlockId): Promise<string | null>;
  getSubsectionTitleAtSynctexBlock(blockId: ISynctexBlockId): Promise<string | null>;
  migrateSelection(
    { selectionStart, selectionEnd }: ISelectionParams,
    targetVersion: string,
  ): Promise<ISelectionParams | null>;
}

const BLOCK_MATCHING_TOLERANCE_AS_FRACTION_OF_PAGE_WIDTH = 0.00375;
const BLOCK_MATCHING_TOLERANCE_AS_FRACTION_OF_PAGE_HEIGHT = 0.0025;
const LATEX_SECTION_PATTERN = /\\section{([^}]+)}/;
const LATEX_SUBSECTION_PATTERN = /\\subsection{([^}]+)}/;
const LATEX_BIBLIOGRAPHY_PATTERN = "\\printbibliography";
const BIBLIOGRAPHY_TITLE = "References";

export const CodeSyncContext = createContext<ICodeSyncContext | null>(null);

export function CodeSyncProvider({ children }: PropsWithChildren) {
  const [synctexData, setSynctexData] = useState<ISynctexData>();
  const { getTexAsLines, getTexAsString, getSynctex } = useCodeStore();
  const { locationParams } = useContext(LocationContext) as ILocationContext;

  const getFilePathById = (id: number): string | null => {
    if (!synctexData) return null;

    return synctexData.files[id.toString()];
  };

  useEffect(() => {
    async function loadSynctex() {
      setSynctexData(await getSynctex(locationParams.version));
    }

    if (locationParams.version) {
      loadSynctex();
    }
  }, [locationParams.version, getSynctex]);

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

      const sourceFileLines = await getTexAsLines(sourceFilePath);

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

      const sourceFileLines = await getTexAsLines(sourceFilePath);

      for (let i = block.line - 1; i >= 0; i--) {
        const matches = sourceFileLines[i].match(LATEX_SUBSECTION_PATTERN);

        if (matches) {
          return matches[1];
        }
      }

      return null;
    },
    async migrateSelection({ selectionStart, selectionEnd }: ISelectionParams, targetVersion: string) {
      if (!synctexData) return null;

      const startBlock = context.getSynctexBlockById(selectionStart);

      if (!startBlock) return null;

      const sourceFilePath = getFilePathById(startBlock.fileId);

      if (!sourceFilePath) return null;

      const [sourceContent, targetContent, targetSynctex] = await Promise.all([
        getTexAsString(sourceFilePath),
        getTexAsString(sourceFilePath, targetVersion),
        getSynctex(targetVersion),
      ]);

      const targetFileId = Object.entries(targetSynctex.files).find(
        ([_, filePath]) => filePath === sourceFilePath,
      )?.[0];

      if (!targetFileId) return null;

      return migrateSelection(
        { selectionStart, selectionEnd },
        sourceContent,
        synctexData,
        targetContent,
        targetSynctex,
        Number.parseInt(targetFileId),
      );
    },
  };

  return <CodeSyncContext.Provider value={context}>{children}</CodeSyncContext.Provider>;
}
