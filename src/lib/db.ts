/**
 * Client-side secure storage.
 * - User keys: IndexedDB persistence
 * - Session/decrypted cache: in-memory only (cleared on refresh)
 */

const DB_NAME = "relayboy_secure_storage";
const DB_VERSION = 2;

export interface UserKeyRecord {
  username: string;
  privateKey: string; // Base64
  publicKey: string;  // Base64
  createdAt: number;
}

export interface SessionRecord {
  peerUsername: string;
  sharedSecret: string; // Base64
  ciphertext?: string; // Base64
  lastUpdated: number;
}

export interface DecryptedMessageRecord {
  id: string | number;
  plaintext: string;
}

export class SecureDB {
  private db: IDBDatabase | null = null;
  private runtimeSessions = new Map<string, SessionRecord>();
  private runtimeDecryptedCache = new Map<string, string>();

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains("user_keys")) {
          db.createObjectStore("user_keys", { keyPath: "username" });
        }

        if (!db.objectStoreNames.contains("sessions")) {
          db.createObjectStore("sessions", { keyPath: "peerUsername" });
        }

        if (!db.objectStoreNames.contains("messages")) {
          db.createObjectStore("messages", { keyPath: "id" });
        }

        // New: decrypted message plaintext cache
        if (!db.objectStoreNames.contains("decrypted_cache")) {
          db.createObjectStore("decrypted_cache", { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
        reject("Failed to open IndexedDB");
      };
    });
  }

  // --- User Keys Store ---

  async saveUserKeys(record: UserKeyRecord): Promise<void> {
    await this.init();
    return this.performTransaction("user_keys", "readwrite", (store) => store.put(record));
  }

  async getUserKeys(username: string): Promise<UserKeyRecord | null> {
    await this.init();
    return this.performTransaction("user_keys", "readonly", (store) => store.get(username.toLowerCase()));
  }

  // --- Sessions Store ---

  async saveSession(record: SessionRecord): Promise<void> {
    this.runtimeSessions.set(record.peerUsername.toLowerCase(), {
      ...record,
      peerUsername: record.peerUsername.toLowerCase(),
    });
  }

  async getSession(peerUsername: string): Promise<SessionRecord | null> {
    return this.runtimeSessions.get(peerUsername.toLowerCase()) || null;
  }

  async deleteSession(peerUsername: string): Promise<void> {
    this.runtimeSessions.delete(peerUsername.toLowerCase());
  }

  // --- Decrypted Message Cache ---

  async cacheDecryptedMessage(id: string | number, plaintext: string): Promise<void> {
    this.runtimeDecryptedCache.set(String(id), plaintext);
  }

  async getCachedMessages(ids: (string | number)[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    for (const id of ids) {
      const key = String(id);
      if (this.runtimeDecryptedCache.has(key)) {
        result.set(key, this.runtimeDecryptedCache.get(key)!);
      }
    }
    return result;
  }

  // --- Generic Transaction Helper ---

  private async performTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not initialized");

      const transaction = this.db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const secureDB = new SecureDB();
