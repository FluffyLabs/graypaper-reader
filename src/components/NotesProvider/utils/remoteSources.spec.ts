import { expect, test } from "vitest";
import type { IRemoteSource } from "../types/RemoteSource";
import { DEFAULT_SOURCES, updateDefaultSources } from "./remoteSources";

const exampleSources: IRemoteSource[] = [
  {
    id: 5,
    name: "My source",
    url: "https://xxx",
    isEnabled: true,
    versions: [],
  },
  ...DEFAULT_SOURCES,
  {
    id: -9999999,
    name: "My old default source",
    url: "https://zzz",
    isEnabled: true,
    versions: [],
  },
];

test("should filter out the sources", () => {
  expect(updateDefaultSources(exampleSources)).toEqual([exampleSources[0], ...DEFAULT_SOURCES]);
});
