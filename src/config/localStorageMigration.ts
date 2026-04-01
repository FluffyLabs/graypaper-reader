import { DOC_CONFIG, lsKey } from "./documentConfig";

/**
 * One-time migration: copy data from old unprefixed localStorage keys
 * to the new doc-prefixed keys. Only runs for the graypaper build
 * (where old keys already exist from before the multi-doc refactor).
 */
export function migrateLocalStorageKeys() {
  if (DOC_CONFIG.docId !== "graypaper") return;

  const migrations = [
    { oldKey: "notes-v2", newKey: lsKey("notes-v2") },
    { oldKey: "notes-v2-backup", newKey: lsKey("notes-v2-backup") },
    { oldKey: "labels-v1", newKey: lsKey("labels-v1") },
    { oldKey: "remote-sources", newKey: lsKey("remote-sources") },
    { oldKey: "remote-sources-backup", newKey: lsKey("remote-sources-backup") },
    { oldKey: "gp-tab", newKey: lsKey("tab") },
  ];

  for (const { oldKey, newKey } of migrations) {
    if (oldKey === newKey) continue;
    const oldValue = window.localStorage.getItem(oldKey);
    const newValue = window.localStorage.getItem(newKey);
    if (oldValue && !newValue) {
      window.localStorage.setItem(newKey, oldValue);
      window.localStorage.removeItem(oldKey);
    }
  }
}
