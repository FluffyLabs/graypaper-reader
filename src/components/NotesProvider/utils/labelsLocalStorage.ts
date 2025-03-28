import type { IStorageLabel } from "../hooks/useLabels";

const LOCAL_STORAGE_KEY = "labels-v1";

function isLabel(x: unknown): x is IStorageLabel {
  if (x === null || typeof x !== "object") {
    return false;
  }
  if (!("label" in x && typeof x.label === "string")) {
    return false;
  }
  if (!("isActive" in x && typeof x.isActive === "boolean")) {
    return false;
  }
  return true;
}

export function loadFromLocalStorage(): IStorageLabel[] {
  try {
    const labelsStr = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    const labels = JSON.parse(labelsStr || "[]");
    if (!Array.isArray(labels)) {
      return [];
    }

    return labels
      .map((x: unknown): IStorageLabel | null => {
        if (isLabel(x)) {
          return x;
        }
        return null;
      })
      .filter((x) => x !== null);
  } catch (e) {
    console.warn("Error reading labels", e);
    return [];
  }
}

export function saveToLocalStorage(labels: IStorageLabel[]) {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(labels));
  } catch (e) {
    console.error("Unable to save labels state", e);
  }
}
