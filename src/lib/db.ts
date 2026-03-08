/**
 * Client-side secure storage.
 * - User keys: IndexedDB persistence
 * - Sessions/decrypted cache: IndexedDB persistence + runtime memory cache
 */

const DB_NAME = "relayboy_secure_storage";
const DB_VERSION = 3;

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

export interface MessageDecryptArtifactRecord {
  artifactKey: string;
  plaintext: string;
  peerUsername: string;
  direction: "in" | "out";
  messageId?: string;
  updatedAt: number;
}

interface DecryptionArtifactInput {
  ciphertext: string;
  plaintext: string;
  peerUsername: string;
  direction: "in" | "out";
  messageId?: string | number;
}

export class SecureDB {
  private db: IDBDatabase | null = null;
  private runtimeSessions = new Map<string, SessionRecord>();
  private runtimeDecryptedCache = new Map<string, string>();
  private runtimeArtifactCache = new Map<string, MessageDecryptArtifactRecord>();

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

        if (!db.objectStoreNames.contains("message_artifacts")) {
          db.createObjectStore("message_artifacts", { keyPath: "artifactKey" });
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
    const normalized: SessionRecord = {
      ...record,
      peerUsername: record.peerUsername.toLowerCase(),
    };
    this.runtimeSessions.set(normalized.peerUsername, normalized);
    await this.init();
    await this.performTransaction("sessions", "readwrite", (store) => store.put(normalized));
  }

  async getSession(peerUsername: string): Promise<SessionRecord | null> {
    const normalizedPeer = peerUsername.toLowerCase();
    const runtime = this.runtimeSessions.get(normalizedPeer);
    if (runtime) return runtime;

    await this.init();
    const persisted = await this.performTransaction<SessionRecord | undefined>(
      "sessions",
      "readonly",
      (store) => store.get(normalizedPeer)
    );
    if (!persisted) return null;

    const normalized: SessionRecord = {
      ...persisted,
      peerUsername: persisted.peerUsername.toLowerCase(),
    };
    this.runtimeSessions.set(normalizedPeer, normalized);
    return normalized;
  }

  async deleteSession(peerUsername: string): Promise<void> {
    const normalizedPeer = peerUsername.toLowerCase();
    this.runtimeSessions.delete(normalizedPeer);
    await this.init();
    await this.performTransaction("sessions", "readwrite", (store) => store.delete(normalizedPeer));
  }

  // --- Decrypted Message Cache ---

  async cacheDecryptedMessage(id: string | number, plaintext: string): Promise<void> {
    const key = String(id);
    this.runtimeDecryptedCache.set(key, plaintext);
    await this.init();
    await this.performTransaction("decrypted_cache", "readwrite", (store) =>
      store.put({ id: key, plaintext } satisfies DecryptedMessageRecord)
    );
  }

  async getCachedMessages(ids: (string | number)[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const missingIds: string[] = [];

    for (const id of ids) {
      const key = String(id);
      if (this.runtimeDecryptedCache.has(key)) {
        result.set(key, this.runtimeDecryptedCache.get(key)!);
      } else {
        missingIds.push(key);
      }
    }

    if (missingIds.length === 0) return result;

    await this.init();
    for (const key of missingIds) {
      const record = await this.performTransaction<DecryptedMessageRecord | undefined>(
        "decrypted_cache",
        "readonly",
        (store) => store.get(key)
      );
      if (record?.plaintext) {
        this.runtimeDecryptedCache.set(key, record.plaintext);
        result.set(key, record.plaintext);
      }
    }

    return result;
  }

  // --- Message Decryption Artifacts ---

  private async sha256Hex(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(hash);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async cacheDecryptionArtifact(input: DecryptionArtifactInput): Promise<void> {
    const artifactKey = await this.sha256Hex(input.ciphertext);
    const record: MessageDecryptArtifactRecord = {
      artifactKey,
      plaintext: input.plaintext,
      peerUsername: input.peerUsername.toLowerCase(),
      direction: input.direction,
      messageId: input.messageId !== undefined ? String(input.messageId) : undefined,
      updatedAt: Date.now(),
    };

    this.runtimeArtifactCache.set(artifactKey, record);
    await this.init();
    await this.performTransaction("message_artifacts", "readwrite", (store) => store.put(record));
  }

  async getCachedPlaintextByCiphertexts(ciphertexts: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    await this.init();

    for (const ciphertext of ciphertexts) {
      const artifactKey = await this.sha256Hex(ciphertext);
      const runtime = this.runtimeArtifactCache.get(artifactKey);
      if (runtime?.plaintext) {
        result.set(ciphertext, runtime.plaintext);
        continue;
      }

      const persisted = await this.performTransaction<MessageDecryptArtifactRecord | undefined>(
        "message_artifacts",
        "readonly",
        (store) => store.get(artifactKey)
      );

      if (persisted?.plaintext) {
        this.runtimeArtifactCache.set(artifactKey, persisted);
        result.set(ciphertext, persisted.plaintext);
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
