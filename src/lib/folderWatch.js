// Local folder monitoring for ERA ONE extraction files.
// Uses the File System Access API: the user grants a directory once, the handle is
// persisted in IndexedDB, and we re-scan it on an interval to detect new/changed files.

const DB = "era-one-folder-watch";
const STORE = "handles";
const KEY = "watchDir";

export const supportsFolderWatch = () =>
  typeof window !== "undefined" && "showDirectoryPicker" in window;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE, mode).objectStore(STORE);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const saveDirHandle = (handle) => tx("readwrite", (s) => s.put(handle, KEY));
export const loadDirHandle = () => tx("readonly", (s) => s.get(KEY));
export const clearDirHandle = () => tx("readwrite", (s) => s.delete(KEY));

export async function pickDirectory() {
  const handle = await window.showDirectoryPicker({ mode: "read", id: "era-one-data" });
  await saveDirHandle(handle);
  return handle;
}

/** true when we still hold read permission (asks the user only if `request`). */
export async function hasPermission(handle, request = false) {
  if (!handle) return false;
  const opts = { mode: "read" };
  if ((await handle.queryPermission(opts)) === "granted") return true;
  if (!request) return false;
  return (await handle.requestPermission(opts)) === "granted";
}

/** Recursively collect .json files (max 3 levels) with a change signature. */
export async function scanDirectory(handle, depth = 0, path = "") {
  const out = [];
  for await (const entry of handle.values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;
    if (entry.kind === "directory") {
      if (depth < 2) out.push(...(await scanDirectory(entry, depth + 1, entryPath)));
    } else if (entry.name.toLowerCase().endsWith(".json")) {
      const file = await entry.getFile();
      out.push({ path: entryPath, file, signature: `${file.size}:${file.lastModified}` });
    }
  }
  return out;
}