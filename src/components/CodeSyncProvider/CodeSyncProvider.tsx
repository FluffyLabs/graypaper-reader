import { migrateSelection } from "@fluffylabs/links-metadata";
import type { ISelectionParams, ISynctexBlock, ISynctexBlockId, ISynctexData } from "@fluffylabs/links-metadata";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
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

export function CodeSyncProvider({ children }: PropsWithChildren) {
  const [synctexData, setSynctexData] = useState<ISynctexData>();
  const texStore = useTexStore();
  const synctexStore = useSynctexStore();
  const { locationParams } = useContext(LocationContext) as ILocationContext;
  const { version } = locationParams;

  useEffect(() => {
    async function loadSynctex() {
      setSynctexData(await synctexStore.getSynctex(version));
    }

    if (version) {
      loadSynctex();
    }
  }, [version, synctexStore]);

  const context: ICodeSyncContext = useMemo(
    () => ({
      getSynctexBlockAtLocation(left, top, pageNumber) {
        if (!synctexData) return null;

        const blocksInCurrPage = synctexData.blocksByPage.get(pageNumber) || [];

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
          return synctexData.blocksByPage.get(blockId.pageNumber)?.[blockId.index] || null;
        } catch (e) {
          console.warn(`Synctex block not found at page ${blockId.pageNumber} and index ${blockId.index}.`, e);
        }

        return null;
      },
      getSynctexBlockRange(startBlockId, endBlockId) {
        if (!synctexData || startBlockId.pageNumber !== endBlockId.pageNumber) return [];

        // todo: for now we assume selections are within one page
        return (
          synctexData.blocksByPage.get(startBlockId.pageNumber)?.slice(startBlockId.index, endBlockId.index + 1) || []
        );
      },
      async getSectionTitleAtSynctexBlock(blockId) {
        const block = context.getSynctexBlockById(blockId);

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
      async getSubsectionTitleAtSynctexBlock(blockId) {
        const block = context.getSynctexBlockById(blockId);

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
      async migrateSelection(
        { selectionStart, selectionEnd }: ISelectionParams,
        sourceVersion: string,
        targetVersion: string,
      ) {
        return migrateSelection({ selectionStart, selectionEnd }, sourceVersion, targetVersion, synctexStore, texStore);
      },
    }),
    [synctexData, synctexStore, texStore, version],
  );

  return <CodeSyncContext.Provider value={context}>{children}</CodeSyncContext.Provider>;
}
