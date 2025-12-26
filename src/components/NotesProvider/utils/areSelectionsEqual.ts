import type { ISynctexBlockId } from "@fluffylabs/links-metadata";

interface ISelection {
  selectionStart?: ISynctexBlockId;
  selectionEnd?: ISynctexBlockId;
}

export const areSelectionsEqual = (selection1?: ISelection, selection2?: ISelection): boolean => {
  return (
    areSelectionPointsEqual(selection1?.selectionStart, selection2?.selectionStart) &&
    areSelectionPointsEqual(selection1?.selectionEnd, selection2?.selectionEnd)
  );
};

export const areSelectionPointsEqual = (point1?: ISynctexBlockId, point2?: ISynctexBlockId): boolean => {
  return point1?.pageNumber === point2?.pageNumber && point1?.index === point2?.index;
};
