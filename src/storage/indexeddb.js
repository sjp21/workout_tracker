const DB_NAME = 'stimulus';
const DB_VERSION = 1;
const STORE = 'app_state';
const KEY = 'main';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let result;
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
    Promise.resolve(fn(store)).then((r) => {
      result = r;
    });
  });
}

export async function readState() {
  return tx('readonly', (store) => {
    return new Promise((res, rej) => {
      const r = store.get(KEY);
      r.onsuccess = () => res(r.result ?? null);
      r.onerror = () => rej(r.error);
    });
  });
}

export async function writeState(state) {
  return tx('readwrite', (store) => {
    return new Promise((res, rej) => {
      const r = store.put(state, KEY);
      r.onsuccess = () => res(true);
      r.onerror = () => rej(r.error);
    });
  });
}
