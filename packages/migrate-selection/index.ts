import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as levenshtein from "fastest-levenshtein";
import type { ISynctexBlock, ISynctexData, ISynctexBlockId } from "@graypaper-reader/types";

const EXPECTED_ARGUMENTS_N = 5;
const MULTI_LINE_BLOCK_PATTERN = /^\\begin{(.*?)}(.*?)^\\end{\1}/gms;
const MIN_CONFIDENCE = 0.8;

async function readFile(archiveDir: string, version: string, filename: string): Promise<string> {
  return fs.readFile(path.join(archiveDir, "dist", `tex-${version}`, filename), { encoding: "utf8" });
}

function getSiblingBlocks(synctex: ISynctexData, page: string, fileId: number, line: number): ISynctexBlock[] {
  return synctex.pages[page].filter((block: ISynctexBlock) => block.fileId === fileId && block.line === line);
}

function getFileId(synctex: ISynctexData, sourceFilename: string): number | null {
  const fileId = Object.entries(synctex.files).find(([_, filename]) => filename === sourceFilename)?.[0];
  return fileId ? Number.parseInt(fileId) : null;
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

  const sourceSiblingBlocks = getSiblingBlocks(
    sourceSynctex,
    blockId.pageNumber.toString(),
    sourceBlock.fileId,
    sourceBlock.line,
  );
  const relativePosition = sourceSiblingBlocks.indexOf(sourceBlock) / (sourceSiblingBlocks.length - 1);

  // Find matching line
  const targetLineNumber =
    sourceBlock.line && sourceLines[sourceBlock.line - 1].startsWith("\\end")
      ? findMultiLineMatch(sourceLines, sourceBlock.line, targetContent)
      : findSingleLineMatch(sourceLines[sourceBlock.line - 2], targetContent);

  if (!targetLineNumber) {
    return null;
  }

  const targetSiblingBlocks = getSiblingBlocks(
    targetSynctex,
    blockId.pageNumber.toString(),
    targetFileId,
    targetLineNumber,
  );
  return targetSiblingBlocks[Math.round(relativePosition * targetSiblingBlocks.length)];
}

export function migrateSelection(
  selectionStart: ISynctexBlockId,
  selectionEnd: ISynctexBlockId,
  sourceContent: string,
  sourceSynctex: ISynctexData,
  targetContent: string,
  targetSynctex: ISynctexData,
  targetFileId: number,
): { selectionStart: ISynctexBlockId; selectionEnd: ISynctexBlockId } | null {
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

async function main() {
  if (process.argv.slice(2).length !== EXPECTED_ARGUMENTS_N) {
    throw new Error("Unexpected number of arguments.");
  }

  const [sourceVersion, targetVersion, page, index, archiveDir] = process.argv.slice(-EXPECTED_ARGUMENTS_N);

  const sourceSynctex = require(path.join(archiveDir, `dist/graypaper-${sourceVersion}.synctex.json`));
  const sourceSynctexBlock = sourceSynctex.pages[page][index];
  const sourceFilename = sourceSynctex.files[sourceSynctexBlock.fileId];
  const sourceContent = await readFile(archiveDir, sourceVersion, sourceFilename);

  const targetSynctex = require(path.join(archiveDir, `dist/graypaper-${targetVersion}.synctex.json`));
  const targetContent = await readFile(archiveDir, targetVersion, sourceFilename);
  const targetFileId = getFileId(targetSynctex, sourceFilename);

  if (!targetFileId) {
    throw new Error("fileId not found.");
  }

  console.log(
    migrateBlock(sourceSynctexBlock, sourceContent, sourceSynctex, targetContent, targetSynctex, targetFileId),
  );
}

main();
