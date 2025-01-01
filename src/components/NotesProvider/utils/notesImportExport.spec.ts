import { expect, test } from "vitest";
import { LABEL_LOCAL } from "../consts/labels";
import type { IStorageNote } from "../types/StorageNote";
import { type INoteV2, exportNotesAsJson, importNotesFromJson } from "./notesImportExport";

const exampleNotes: IStorageNote[] = [
  {
    noteVersion: 3,
    content: "Hello world!",
    date: 123456789,
    author: "test",
    version: "deadbeef",
    labels: [LABEL_LOCAL],
    selectionStart: {
      index: 0,
      pageNumber: 0,
    },
    selectionEnd: {
      index: 0,
      pageNumber: 0,
    },
  },
];

test("should export v3 envelope", () => {
  expect(
    exportNotesAsJson(
      {
        version: 3,
        notes: exampleNotes,
      },
      true,
    ),
  ).toBe(
    '{"version":3,"notes":[{"noteVersion":3,"content":"Hello world!","date":123456789,"author":"test","version":"deadbeef","labels":[],"selectionStart":{"index":0,"pageNumber":0},"selectionEnd":{"index":0,"pageNumber":0}}]}',
  );
});

test("should import v3 envelope", () => {
  const notesStr = exportNotesAsJson(
    {
      version: 3,
      notes: exampleNotes,
    },
    true,
  );
  expect(importNotesFromJson(notesStr, "must-have-label")).toStrictEqual({
    notes: [
      {
        ...exampleNotes[0],
        labels: ["must-have-label"],
      },
    ],
    version: 3,
  });
});

test("should import v2 notes", () => {
  const notesV2: INoteV2[] = [
    {
      content:
        "Here it seems that even if the value is smaller than `b_z` we still fail if the memory there is not writable!",
      date: 1729929377597,
      author: "",
      pageNumber: 46,
      selectionStart: { pageNumber: 46, index: 569 },
      selectionEnd: { pageNumber: 46, index: 578 },
      selectionString: "if v ≠ ∅ ∧ Zbo⋅⋅⋅+bz ⊂ V∗\nµ",
      version: "911af30f94dad0c7784d60d568d9c032517821ee",
    },
  ];
  const notesStr = JSON.stringify(notesV2);

  expect(importNotesFromJson(notesStr, "must-have-label")).toStrictEqual({
    version: 3,
    notes: [
      {
        noteVersion: 3,
        content:
          "Here it seems that even if the value is smaller than `b_z` we still fail if the memory there is not writable!",
        date: 1729929377597,
        author: "",
        labels: ["must-have-label"],
        selectionStart: {
          pageNumber: 46,
          index: 569,
        },
        selectionEnd: {
          pageNumber: 46,
          index: 578,
        },
        version: "911af30f94dad0c7784d60d568d9c032517821ee",
      },
    ],
  });
});
