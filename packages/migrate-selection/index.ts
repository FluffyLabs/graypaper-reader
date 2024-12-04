import type { ISelectionParams, ISynctexBlock, ISynctexBlockId, ISynctexData } from "@fluffylabs/types";
import * as levenshtein from "fastest-levenshtein";

const MULTI_LINE_BLOCK_PATTERN = /^\\begin{(.*?)}(.*?)^\\end{\1}/gms;
const MIN_CONFIDENCE = 0.8;

function getSiblingBlocks(synctex: ISynctexData, fileId: number, line: number): ISynctexBlock[] {
  const siblingBlocks: ISynctexBlock[] = [];

  for (const blocks of Object.values(synctex.pages)) {
    siblingBlocks.push(...blocks.filter((block: ISynctexBlock) => block.fileId === fileId && block.line === line));
  }

  return siblingBlocks;
}

function getBlockId(block: ISynctexBlock): ISynctexBlockId {
  return {
    pageNumber: block.pageNumber,
    index: block.index,
  };
}

function calculateConfidence(source: string, target: string, distance: number): number {
  return 1 - distance / Math.max(source.length, target.length);
}

function findMultiLineMatch(sourceLines: string[], sourceLine: number, targetContent: string) {
  for (let i = sourceLine - 2; i >= 0; i--) {
    if (sourceLines[i].startsWith("\\begin")) {
      const beginToEnd = sourceLines.slice(i, sourceLine).join("\n");
      let closestMatch: [RegExpExecArray, number] | null = null;

      for (const match of targetContent.matchAll(MULTI_LINE_BLOCK_PATTERN)) {
        const distance = levenshtein.distance(beginToEnd, match[0]);
        if (closestMatch === null || closestMatch[1] > distance) {
          closestMatch = [match, distance];
        }
      }

      if (!closestMatch) return null;

      const confidence = calculateConfidence(beginToEnd, closestMatch[0][0], closestMatch[1]);
      if (confidence < MIN_CONFIDENCE) return null;

      const targetLineNumber =
        targetContent.substring(0, closestMatch[0].index).split("\n").length +
        closestMatch[0][0].split("\n").length -
        1;

      return targetLineNumber;
    }
  }
  return null;
}

function findSingleLineMatch(sourceLine: string, targetContent: string) {
  const targetLines = targetContent.split("\n");
  let closestMatch: readonly [string, number, number] | null = null;

  for (const [index, content] of targetLines.entries()) {
    const distance = levenshtein.distance(sourceLine, content);
    if (closestMatch === null || closestMatch[2] > distance) {
      closestMatch = [content, index + 2, distance];
    }
  }

  if (!closestMatch) return null;

  const confidence = calculateConfidence(sourceLine, closestMatch[0], closestMatch[2]);
  return confidence >= MIN_CONFIDENCE ? closestMatch[1] : null;
}

export function migrateBlock(
  blockId: ISynctexBlockId,
  sourceContent: string,
  sourceSynctex: ISynctexData,
  targetContent: string,
  targetSynctex: ISynctexData,
  targetFileId: number,
): ISynctexBlock | null {
  const sourceLines = sourceContent.split("\n");
  const sourceBlock = sourceSynctex.pages[blockId.pageNumber.toString()][blockId.index];

  const sourceSiblingBlocks = getSiblingBlocks(sourceSynctex, sourceBlock.fileId, sourceBlock.line);
  const relativePosition = sourceSiblingBlocks.indexOf(sourceBlock) / (sourceSiblingBlocks.length - 1);

  const targetLineNumber =
    sourceBlock.line && sourceLines[sourceBlock.line - 1].startsWith("\\end")
      ? findMultiLineMatch(sourceLines, sourceBlock.line, targetContent)
      : findSingleLineMatch(sourceLines[sourceBlock.line - 2], targetContent);

  if (!targetLineNumber) {
    return null;
  }

  const targetSiblingBlocks = getSiblingBlocks(targetSynctex, targetFileId, targetLineNumber);
  return targetSiblingBlocks[Math.round(relativePosition * (targetSiblingBlocks.length - 1))];
}

export function migrateSelection(
  { selectionStart, selectionEnd }: ISelectionParams,
  sourceContent: string,
  sourceSynctex: ISynctexData,
  targetContent: string,
  targetSynctex: ISynctexData,
  targetFileId: number,
): ISelectionParams | null {
  const selectionStartBlock = migrateBlock(
    selectionStart,
    sourceContent,
    sourceSynctex,
    targetContent,
    targetSynctex,
    targetFileId,
  );
  const selectionEndBlock = migrateBlock(
    selectionEnd,
    sourceContent,
    sourceSynctex,
    targetContent,
    targetSynctex,
    targetFileId,
  );

  if (!selectionStartBlock || !selectionEndBlock) {
    return null;
  }

  return {
    selectionStart: getBlockId(selectionStartBlock),
    selectionEnd: getBlockId(selectionEndBlock),
  };
}
