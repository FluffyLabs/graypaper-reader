import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as levenshtein from "fastest-levenshtein";

const EXPECTED_ARGUMENTS_N = 5;
const MULTI_LINE_BLOCK_PATTERN = /^\\begin{(.*?)}(.*?)^\\end{\1}/gms;
const MIN_CONFIDENCE = 0.8;

interface SynctexBlock {
  fileId: number;
  line: number;
}

// Helper functions to reduce code duplication
async function readFile(archiveDir: string, version: string, filename: string): Promise<string> {
  return fs.readFile(path.join(archiveDir, "dist", `tex-${version}`, filename), { encoding: "utf8" });
}

function getSiblingBlocks(synctex: any, page: string, fileId: number, line: number): SynctexBlock[] {
  return synctex.pages[page].filter((block: SynctexBlock) => block.fileId === fileId && block.line === line);
}

function findtargetFileId(synctex: any, sourceFilename: string): number | null {
  const fileId = Object.entries(synctex.files).find(([_, filename]) => filename === sourceFilename)?.[0];
  return fileId ? Number.parseInt(fileId) : null;
}

function calculateConfidence(source: string, target: string, distance: number): number {
  return 1 - distance / Math.max(source.length, target.length);
}

async function findMultiLineMatch(sourceLines: string[], sourceLine: number, targetContent: string) {
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

async function findSingleLineMatch(sourceLine: string, targetContent: string) {
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

async function main() {
  if (process.argv.length < EXPECTED_ARGUMENTS_N) {
    throw new Error("Unexpected number of arguments.");
  }

  const [sourceVersion, targetVersion, page, index, archiveDir] = process.argv.slice(-EXPECTED_ARGUMENTS_N);

  const sourceSynctex = require(path.join(archiveDir, `dist/graypaper-${sourceVersion}.synctex.json`));
  const sourceSynctexBlock = sourceSynctex.pages[page][index];
  const sourceFilename = sourceSynctex.files[sourceSynctexBlock.fileId];
  const sourceContent = await readFile(archiveDir, sourceVersion, sourceFilename);
  const sourceLines = sourceContent.split("\n");

  const targetSynctex = require(path.join(archiveDir, `dist/graypaper-${targetVersion}.synctex.json`));
  const targetContent = await readFile(archiveDir, targetVersion, sourceFilename);

  const sourceSiblingBlocks = getSiblingBlocks(sourceSynctex, page, sourceSynctexBlock.fileId, sourceSynctexBlock.line);
  const relativePosition = sourceSiblingBlocks.indexOf(sourceSynctexBlock) / (sourceSiblingBlocks.length - 1);

  // Find matching line
  const targetLineNumber =
    sourceSynctexBlock.line && sourceLines[sourceSynctexBlock.line - 1].startsWith("\\end")
      ? await findMultiLineMatch(sourceLines, sourceSynctexBlock.line, targetContent)
      : await findSingleLineMatch(sourceLines[sourceSynctexBlock.line - 2], targetContent);

  if (!targetLineNumber) {
    console.log("No match found with sufficient confidence.");
    return;
  }

  const targetFileId = findtargetFileId(targetSynctex, sourceFilename);
  if (!targetFileId) {
    console.log("fileId not found.");
    return;
  }

  const targetSiblingBlocks = getSiblingBlocks(targetSynctex, page, targetFileId, targetLineNumber);
  const targetBlock = targetSiblingBlocks[Math.round(relativePosition * targetSiblingBlocks.length)];

  console.log("selected block:", targetBlock);
}

main();
