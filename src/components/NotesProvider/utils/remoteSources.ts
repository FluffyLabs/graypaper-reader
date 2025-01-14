import type { IRemoteSource } from "../types/RemoteSource";

const DEFAULT_SOURCES = [
  {
    id: 1,
    name: "Element Activity",
    url: "https://fluffylabs.dev/graypaper-notes/2024-element.json",
    isEnabled: true,
    versions: null,
  },
  {
    id: 2,
    name: "Changes in v0.5.4",
    url: "https://fluffylabs.dev/graypaper-notes/version-0.5.4.json",
    isEnabled: true,
    versions: ["579bd12e792667c968ab64d07f56c6b7da72b4e2"],
  },
];

export function loadFromLocalStorage(): IRemoteSource[] {
  return DEFAULT_SOURCES;
}
