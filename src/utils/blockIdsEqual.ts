import type { ISynctexBlockId } from "@fluffylabs/types";

export function blockIdsEqual(blockId1: ISynctexBlockId, blockId2: ISynctexBlockId): boolean {
  return blockId1.pageNumber === blockId2.pageNumber && blockId1.index === blockId2.index;
}
