import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as levenshtein from "fastest-levenshtein";

const EXPECTED_ARGUMENTS_N = 5;
const MULTI_LINE_BLOCK_PATTERN = /^\\begin{(.*?)}(.*?)^\\end{\1}/gms;
const MIN_CONFIDENCE = 0.8;

async function main() {
  if (process.argv.length < EXPECTED_ARGUMENTS_N) {
    throw new Error("Unexpected number of arguments.");
  }

  const [sourceVersion, destinationVersion, page, index, archiveDir] = process.argv.slice(-EXPECTED_ARGUMENTS_N);

  const sourceSynctexPath = path.join(archiveDir, `dist/graypaper-${sourceVersion}.synctex.json`);
  const sourceSynctex = require(sourceSynctexPath);
  const sourceSynctexBlock = sourceSynctex.pages[page][index];
  const sourceFilename = sourceSynctex.files[sourceSynctexBlock.fileId];
  const sourceContent = await fs.readFile(path.join(archiveDir, "dist", `tex-${sourceVersion}`, sourceFilename), {
    encoding: "utf8",
  });
  const sourceContentLines = sourceContent.split("\n");
  const sourceLine = sourceContentLines[sourceSynctexBlock.line - 1];

  const sourceSiblingBlocks = sourceSynctex.pages[page].filter(
    ({ fileId, line }: { fileId: number; line: number }) =>
      fileId === sourceSynctexBlock.fileId && line === sourceSynctexBlock.line,
  );
  const sourceSynctexBlockPositionRelativeToSiblings =
    // @ts-ignore
    sourceSiblingBlocks.findIndex((block) => block === sourceSynctexBlock) / (sourceSiblingBlocks.length - 1);

  const destinationSynctexPath = path.join(archiveDir, `dist/graypaper-${destinationVersion}.synctex.json`);
  const destinationSynctex = require(destinationSynctexPath);
  // todo: what happens when the file has been renamed or removed

  console.log("migrating block:", sourceSynctexBlock);

  const destinationContent = await fs.readFile(
    path.join(archiveDir, "dist", `tex-${destinationVersion}`, sourceFilename),
    {
      encoding: "utf8",
    },
  );

  if (sourceLine.startsWith("\\end")) {
    // Case 1: we are dealing with a multi-line (usually math) block
    for (let i = sourceSynctexBlock.line - 2; i >= 0; i--) {
      if (sourceContentLines[i].startsWith("\\begin")) {
        const beginToEnd = sourceContentLines.slice(i, sourceSynctexBlock.line).join("\n");

        console.log("looking for:", beginToEnd);

        const destinationMultiLineBlockMatches = destinationContent.matchAll(MULTI_LINE_BLOCK_PATTERN);
        let closestMatch: [RegExpExecArray, number] | null = null;

        for (const match of destinationMultiLineBlockMatches) {
          const distance = levenshtein.distance(beginToEnd, match[0]);

          if (closestMatch === null || closestMatch[1] > distance) {
            closestMatch = [match, distance];
          }
        }

        if (!closestMatch) break;

        const confidenceLevel = 1 - closestMatch[1] / Math.max(beginToEnd.length, closestMatch[0][0].length);

        if (confidenceLevel < MIN_CONFIDENCE) {
          console.log("No match found.");
          break;
        }

        // console.log(destinationContents.substring(0, closestMatch[0].index));

        const destinationLineNumber =
          destinationContent.substring(0, closestMatch[0].index).split("\n").length +
          closestMatch[0][0].split("\n").length -
          1;
        const destinationFileId = Number.parseInt(
          Object.entries(destinationSynctex.files).find(([_, filename]) => filename === sourceFilename)?.[0] || "",
        );

        if (!destinationFileId) {
          console.log("fileId not found.");
          break;
        }

        const destinationSiblingBlocks = destinationSynctex.pages[page].filter(
          ({ fileId, line }: { fileId: number; line: number }) =>
            fileId === destinationFileId && line === destinationLineNumber,
        );
        console.log("destination sibling blocks:", destinationSiblingBlocks);
        const destinationBlock =
          destinationSiblingBlocks[
            Math.round(sourceSynctexBlockPositionRelativeToSiblings * destinationSiblingBlocks.length)
          ];

        console.log("selected block:", destinationBlock);
        console.log("confidence level:", confidenceLevel);
        console.log("relative position:", sourceSynctexBlockPositionRelativeToSiblings);

        break;
      }
    }
  } else {
    // Case 2: regular paragraph. for some reason synctex points one line too far
    const sourceLineToMatch = sourceContentLines[sourceSynctexBlock.line - 2];
    const destinationContentLines = destinationContent.split("\n");

    let closestMatch: readonly [string, number, number] | null = null; // [line, lineNumber, distance]

    for (const [index, content] of destinationContentLines.entries()) {
      const distance = levenshtein.distance(sourceLineToMatch, content);

      if (closestMatch === null || closestMatch[2] > distance) {
        closestMatch = [content, index + 2, distance];
      }
    }

    if (!closestMatch) {
      return;
    }

    const confidenceLevel = 1 - closestMatch[2] / Math.max(sourceLineToMatch.length, closestMatch[0].length);

    if (confidenceLevel < MIN_CONFIDENCE) {
      console.log("No match found with sufficient confidence.");
      return;
    }

    const destinationFileId = Number.parseInt(
      Object.entries(destinationSynctex.files).find(([_, filename]) => filename === sourceFilename)?.[0] || "",
    );

    if (!destinationFileId) {
      console.log("fileId not found.");
      return;
    }

    const destinationSiblingBlocks = destinationSynctex.pages[page].filter(
      ({ fileId, line }: { fileId: number; line: number }) => fileId === destinationFileId && line === closestMatch[1],
    );

    const destinationBlock =
      destinationSiblingBlocks[
        Math.round(sourceSynctexBlockPositionRelativeToSiblings * destinationSiblingBlocks.length)
      ];

    console.log("selected block:", destinationBlock);
    console.log("confidence level:", confidenceLevel);
    console.log("relative position:", sourceSynctexBlockPositionRelativeToSiblings);
  }
}

main();
