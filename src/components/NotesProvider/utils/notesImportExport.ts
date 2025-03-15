import type { ISelectionParams, UnPrefixedLabel } from "@fluffylabs/links-metadata";
import type { INoteV3, INotesEnvelope } from "../types/StorageNote";

/** Download given string as a JSON file. */
function downloadJsonFile(strNotes: string, fileName: string) {
  const link = document.createElement("a");
  link.setAttribute("href", `data:application/json;charset=utf-8,${encodeURIComponent(strNotes)}`);
  link.setAttribute("download", fileName);
  link.click();
}

/** Export and download a JSON file with notes. */
export function downloadNotesAsJson(notes: INotesEnvelope, fileName: string) {
  return downloadJsonFile(exportNotesAsJson(notes), fileName);
}

/**
 * Export a collection of notes to a JSON string.
 *
 * Note the format needs to be compatible with `importNotesFromJson`.
 *
 * Removes non-user defined labels if `clearLabels` flag is set.
 */
export function exportNotesAsJson(wrapper: INotesEnvelope): string {
  const notes = wrapper.notes.slice();
  return JSON.stringify({
    ...wrapper,
    notes,
  });
}

export type ImportNotesOptions =
  | {
      /** A label which every note needs to have. */
      mustHaveLabel: UnPrefixedLabel;
      defaultLabel?: undefined;
    }
  | {
      mustHaveLabel?: UnPrefixedLabel;
      /** A label added to a note if it has no labels at all. */
      defaultLabel: UnPrefixedLabel;
    };
/**
 * Parse given string as a collection of notes.
 *
 * This function supports parsing legacy version of the notes as well and converts
 * them to recent wrapper type.
 */
export function importNotesFromJson(
  jsonStr: string,
  { defaultLabel, mustHaveLabel }: ImportNotesOptions,
): INotesEnvelope {
  const parsed: unknown = JSON.parse(jsonStr);
  // V3
  if (isINotesEnvelopeV3(parsed)) {
    parsed.notes.map((note) => {
      if (mustHaveLabel && note.labels.indexOf(mustHaveLabel) === -1) {
        note.labels.unshift(mustHaveLabel);
      }
      if (defaultLabel && note.labels.length === 0) {
        note.labels.push(defaultLabel);
      }
    });
    return parsed;
  }

  // V2
  if (Array.isArray(parsed)) {
    if (parsed.every(isINoteV2)) {
      return {
        version: 3,
        notes: parsed.map((note) => convertNoteV2toV3(note, mustHaveLabel ?? defaultLabel ?? "new")),
      };
    }

    throw new Error("(V2) Notes JSON should be an array of note object.");
  }

  throw new Error("Invalid notes format.");
}

function isINotesEnvelopeV3(arg: unknown): arg is INotesEnvelope {
  if (!(typeof arg === "object" && arg !== null)) return false;
  if (!("version" in arg && arg.version === 3)) return false;
  if (!("notes" in arg && Array.isArray(arg.notes))) return false;

  return arg.notes.every(isINoteV3);
}

function isINoteV3(arg: unknown): arg is INoteV3 {
  if (!(typeof arg === "object" && arg !== null)) return false;
  if (!("noteVersion" in arg && arg.noteVersion === 3)) return false;
  if (!("content" in arg && typeof arg.content === "string")) return false;
  if (!("date" in arg && typeof arg.date === "number")) return false;
  if (!("author" in arg && typeof arg.author === "string")) return false;
  if (!("version" in arg && typeof arg.version === "string")) return false;
  if (!("labels" in arg && Array.isArray(arg.labels))) return false;

  return true;
}

/** Version 2 of the note format. */
export interface INoteV2 extends ISelectionParams {
  content: string;
  date: number;
  // Always empty
  author: string;
  pageNumber: number;
  version: string;
  selectionString: string;
}

function isINoteV2(arg: unknown): arg is INoteV2 {
  if (typeof arg !== "object" || arg === null) return false;
  if (!("content" in arg) || typeof arg.content !== "string") return false;
  if (!("date" in arg) || typeof arg.date !== "number") return false;
  if (!("author" in arg) || typeof arg.author !== "string") return false;
  if (!("pageNumber" in arg) || typeof arg.pageNumber !== "number") return false;
  if (!("version" in arg) || typeof arg.version !== "string") return false;

  return true;
}

function convertNoteV2toV3(note: INoteV2, label: UnPrefixedLabel): INoteV3 {
  return {
    noteVersion: 3,
    content: note.content,
    date: note.date,
    author: note.author,
    version: note.version,
    labels: [label],
    selectionStart: note.selectionStart,
    selectionEnd: note.selectionEnd,
  };
}
