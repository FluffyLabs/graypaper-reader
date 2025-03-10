import { expect, test } from "vitest";
import { type ILabel, buildLabelTree } from "./useLabels";

const exampleLabels1: ILabel[] = [
  {
    label: "local",
    isActive: true,
  },
  {
    label: "a/b/c",
    isActive: true,
  },
];

test("should build a label tree #1", () => {
  const tree = buildLabelTree(exampleLabels1).map((label) => ({
    label: label.label,
    isActive: label.isActive,
  }));
  expect(tree).toStrictEqual([
    {
      isActive: true,
      label: "a",
    },
    {
      isActive: true,
      label: "a/b",
    },
    {
      isActive: true,
      label: "a/b/c",
    },
    {
      isActive: true,
      label: "local",
    },
  ]);
});

const exampleLabels2: ILabel[] = [
  {
    label: "local",
    isActive: true,
  },
  {
    label: "a/b/c",
    isActive: true,
  },
  {
    label: "a/b/d",
    isActive: true,
  },

  {
    label: "a/c",
    isActive: true,
  },
];

test("should build a label tree #2", () => {
  const tree = buildLabelTree(exampleLabels2).map((label) => ({
    label: label.label,
    isActive: label.isActive,
  }));
  expect(tree).toStrictEqual([
    {
      isActive: true,
      label: "a",
    },
    {
      isActive: true,
      label: "a/b",
    },
    {
      isActive: true,
      label: "a/b/c",
    },
    {
      isActive: true,
      label: "a/b/d",
    },
    {
      isActive: true,
      label: "a/c",
    },
    {
      isActive: true,
      label: "local",
    },
  ]);
});

const exampleLabels3: ILabel[] = [
    {
      label: "local",
      isActive: true,
    },
    {
      label: "a/b/c",
      isActive: false,
    },
    {
      label: "a/b/d",
      isActive: false,
    },

    {
      label: "a/c",
      isActive: true,
    },
  ];

  test("should build a label tree and preserve logic activity", () => {
    const tree = buildLabelTree(exampleLabels3).map((label) => ({
      label: label.label,
      isActive: label.isActive,
    }));
    expect(tree).toStrictEqual([
      {
        isActive: true,
        label: "a",
      },
      {
        isActive: false,
        label: "a/b",
      },
      {
        isActive: false,
        label: "a/b/c",
      },
      {
        isActive: false,
        label: "a/b/d",
      },
      {
        isActive: true,
        label: "a/c",
      },
      {
        isActive: true,
        label: "local",
      },
    ]);
  });
