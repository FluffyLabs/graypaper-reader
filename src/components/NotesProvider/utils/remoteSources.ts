import type { IRemoteSource } from "../types/RemoteSource";

const LOCAL_STORAGE_KEY = "remote-sources";
const BACKUP_STORAGE_KEY = "remote-sources-backup";

// negative indices to avoid conflicts with user-added sources.
const DEFAULT_SOURCES = [
  {
    id: -2,
    name: "Element Activity (2024; v0.4.x)",
    url: "https://fluffylabs.dev/graypaper-notes/2024-element-v0.4.x.json",
    isEnabled: true,
    versions: null,
  },
  {
    id: -3,
    name: "Element Activity (2024; v0.5.0)",
    url: "https://fluffylabs.dev/graypaper-notes/2024-element-v0.5.0.json",
    isEnabled: true,
    versions: null,
  },
  {
    id: -4,
    name: "Element Activity (2024; v0.5.2)",
    url: "https://fluffylabs.dev/graypaper-notes/2024-element-v0.5.2.json",
    isEnabled: true,
    versions: null,
  },
  {
    id: -5,
    name: "Element Activity (2024; v0.5.3)",
    url: "https://fluffylabs.dev/graypaper-notes/2024-element-v0.5.3.json",
    isEnabled: true,
    versions: null,
  },
  {
    id: -100,
    name: "Changes in v0.5.4",
    url: "https://fluffylabs.dev/graypaper-notes/version-0.5.4.json",
    isEnabled: false,
    versions: ["579bd12e792667c968ab64d07f56c6b7da72b4e2"],
  },
  {
    id: -101,
    name: "Changes in v0.6.x",
    url: "https://fluffylabs.dev/graypaper-notes/version-0.6.0.json",
    isEnabled: true,
    versions: [
      "78ca0a81d8058531c2e2e46235db2b832eae0213",
      "4bb8fd258ee2d49767f6725993fb5a4045ee19a3",
      "5f542d710f52bcfd22cd400d1b0b99e15003cc67",
    ],
  },
];

function updateDefaultSources(sources: IRemoteSource[]) {
  const ids = sources.map((x) => x.id);
  for (const def of DEFAULT_SOURCES) {
    const idx = ids.indexOf(def.id);
    if (idx === -1) {
      sources.unshift(def);
    } else {
      // just save the enabled state and update the rest
      sources[idx] = { ...def, isEnabled: sources[idx].isEnabled };
    }
  }
  return sources;
}

export function loadFromLocalStorage(): IRemoteSource[] {
  try {
    const items = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? "{}");
    if (items.version === 1) {
      return updateDefaultSources(items.sources ?? []);
    }
  } catch (e) {
    console.error("Unable to read remote sources from local storage", e);
  }

  return DEFAULT_SOURCES;
}

function envelope(sources: IRemoteSource[]) {
  return {
    version: 1,
    sources,
  };
}

export function saveToLocalStorage(newRemoteSources: IRemoteSource[]) {
  try {
    const prev = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    window.localStorage.setItem(BACKUP_STORAGE_KEY, prev ?? "");
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(envelope(newRemoteSources)));
  } catch (e) {
    console.error("Error while saving remote sources to local storage", e);
  }
}
