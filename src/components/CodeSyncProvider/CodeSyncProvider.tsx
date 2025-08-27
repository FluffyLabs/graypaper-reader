import { migrateSelection as migrateSelectionRaw } from "@fluffylabs/links-metadata";
import type { ISelectionParams, ISynctexBlock, ISynctexBlockId, ISynctexData } from "@fluffylabs/links-metadata";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import { isFeatureEnabled } from "../../devtools";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { debugDrawBlock } from "./debugDrawBlock";
import { useSynctexStore } from "./hooks/useSynctexStore";
import { useTexStore } from "./hooks/useTexStore";

export interface ICodeSyncContext {
  getSynctexBlockAtLocation(left: number, top: number, pageNumber: number): ISynctexBlock | null;
  getSynctexBlockById(blockId: ISynctexBlockId): ISynctexBlock | null;
  getSynctexBlockRange(startBlockId: ISynctexBlockId, endBlockId: ISynctexBlockId): ISynctexBlock[];
  getSectionTitleAtSynctexBlock(blockId: ISynctexBlockId): Promise<string | null>;
  getSubsectionTitleAtSynctexBlock(blockId: ISynctexBlockId): Promise<string | null>;
  migrateSelection(
    { selectionStart, selectionEnd }: ISelectionParams,
    sourceVersion: string,
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

const isPathologicalBlock = (block: { width: number; height: number }) => {
  // Block is pathological if:
  // - Height exceeds 15% of page height, OR
  // - Width exceeds 95% of page width
  return block.height > 0.15 || block.width > 0.95;
};

export function CodeSyncProvider({ children }: PropsWithChildren) {
  const [synctexData, setSynctexData] = useState<ISynctexData>();
  const texStore = useTexStore();
  const synctexStore = useSynctexStore();
  const { locationParams } = useContext(LocationContext) as ILocationContext;
  const { version } = locationParams;

  useEffect(() => {
    async function loadSynctex() {
      const synctex = await synctexStore.getSynctex(version);
      setSynctexData(synctex);
    }

    if (version) {
      loadSynctex();
    }
  }, [version, synctexStore]);

  const getSynctexBlockAtLocation = useCallback(
    (left: number, top: number, pageNumber: number) => {
      if (!synctexData) return null;

      const blocksInCurrPage = synctexData.blocksByPage.get(pageNumber) || [];

      let lastMatch: ISynctexBlock | null = null;

      for (let i = 0; i < blocksInCurrPage.length; i++) {
        const currBlock = blocksInCurrPage[i];

        if (isPathologicalBlock(currBlock)) {
          continue;
        }

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
    [synctexData],
  );

  const getSynctexBlockById = useCallback(
    (blockId: ISynctexBlockId) => {
      if (!synctexData) return null;

      try {
        return synctexData.blocksByPage.get(blockId.pageNumber)?.[blockId.index] || null;
      } catch (e) {
        console.warn(`Synctex block not found at page ${blockId.pageNumber} and index ${blockId.index}.`, e);
      }

      return null;
    },
    [synctexData],
  );

  const getSynctexBlockRange = useCallback(
    (startBlockId: ISynctexBlockId, givenEndBlockId: ISynctexBlockId) => {
      if (!synctexData) return [];

      let endBlockId = givenEndBlockId;
      // Since we don't really know how to handle multi-page selections yet,
      // let's just assume that only start block is selected.
      if (startBlockId.pageNumber !== givenEndBlockId.pageNumber) {
        endBlockId = startBlockId;
      }

      // todo: for now we assume selections are within one page
      const rangeOfBlocks =
        synctexData.blocksByPage.get(startBlockId.pageNumber)?.slice(startBlockId.index, endBlockId.index + 1) ?? [];

      const goodBlocks = rangeOfBlocks.filter((block) => !isPathologicalBlock(block)) || [];

      if (isFeatureEnabled("DEBUG_DRAW_BLOCKS")) {
        for (const block of goodBlocks) {
          debugDrawBlock(startBlockId.pageNumber, block);
        }
      }

      return goodBlocks;
    },
    [synctexData],
  );

  const getSectionTitleAtSynctexBlock = useCallback(
    async (blockId: ISynctexBlockId) => {
      const block = getSynctexBlockById(blockId);

      if (!block) return null;

      const sourceFilePath = synctexData?.filePathsByFileId.get(block.fileId);

      if (!sourceFilePath) return null;

      const sourceFileLines = await texStore.getTexAsLines(sourceFilePath, version);
      const line = sourceFileLines[Math.max(block.line - 2, 0)];

      if (line?.startsWith(LATEX_BIBLIOGRAPHY_PATTERN)) {
        return BIBLIOGRAPHY_TITLE;
      }

      for (let i = block.line - 1; i >= 0; i--) {
        const matches = sourceFileLines[i]?.match(LATEX_SECTION_PATTERN);

        if (matches) {
          return matches[1];
        }
      }

      return null;
    },
    [version, getSynctexBlockById, synctexData, texStore],
  );

  const getSubsectionTitleAtSynctexBlock = useCallback(
    async (blockId: ISynctexBlockId) => {
      const block = getSynctexBlockById(blockId);

      if (!block) return null;

      const sourceFilePath = synctexData?.filePathsByFileId.get(block.fileId);

      if (!sourceFilePath) return null;

      const sourceFileLines = await texStore.getTexAsLines(sourceFilePath, version);

      for (let i = block.line - 1; i >= 0; i--) {
        const matches = sourceFileLines[i]?.match(LATEX_SUBSECTION_PATTERN);

        if (matches) {
          return matches[1];
        }
      }

      return null;
    },
    [version, getSynctexBlockById, synctexData, texStore],
  );

  const migrateSelection = useCallback(
    async ({ selectionStart, selectionEnd }: ISelectionParams, sourceVersion: string, targetVersion: string) => {
      return migrateSelectionRaw(
        { selectionStart, selectionEnd },
        sourceVersion,
        targetVersion,
        synctexStore,
        texStore,
      );
    },
    [synctexStore, texStore],
  );

  const context = {
    getSynctexBlockAtLocation,
    getSynctexBlockById,
    getSynctexBlockRange,
    getSectionTitleAtSynctexBlock,
    getSubsectionTitleAtSynctexBlock,
    migrateSelection,
  };

  return <CodeSyncContext.Provider value={context}>{children}</CodeSyncContext.Provider>;
}
