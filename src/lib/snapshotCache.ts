import type { DirectorySnapshot } from '../types'
import { safeRemoveItem } from './storage'

// Cache do snapshot em IndexedDB. O JSON do diretório já passa de 4 MB, perto
// do limite de ~5 MB do localStorage (dividido com todo o GitHub Pages da org);
// ao estourar, o cache falhava em silêncio. IndexedDB não tem esse teto prático.

const DB_NAME = 'ofbr-directory'
const STORE = 'snapshots'
const KEY = 'latest'

// Chave do cache antigo em localStorage — removida para liberar a cota.
const LEGACY_LS_KEY = 'ofbr-directory-snapshot-v1'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function run<T>(
  mode: IDBTransactionMode,
  op: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = op(tx.objectStore(STORE))
        tx.oncomplete = () => {
          db.close()
          resolve(req.result as T)
        }
        tx.onerror = tx.onabort = () => {
          db.close()
          reject(tx.error)
        }
      }),
  )
}

export async function readSnapshot(): Promise<DirectorySnapshot | null> {
  try {
    const snap = await run<DirectorySnapshot | undefined>('readonly', (s) => s.get(KEY))
    return snap && Array.isArray(snap.organisations) ? snap : null
  } catch {
    // IndexedDB indisponível (alguns modos privados) — sem cache
    return null
  }
}

export async function writeSnapshot(snap: DirectorySnapshot): Promise<void> {
  safeRemoveItem(LEGACY_LS_KEY)
  try {
    await run('readwrite', (s) => s.put(snap, KEY))
  } catch {
    // sem espaço ou indisponível — seguimos em memória
  }
}
