/**
 * Servicio de caché para la aplicación Rout2Me
 * Implementa caché usando IndexedDB para almacenar imágenes, tiles de mapas y otros assets
 */

export interface CacheItem {
  key: string;
  data: Blob;
  timestamp: number;
  size: number;
  type: string;
}

export interface CacheConfig {
  maxSize: number; // Tamaño máximo en bytes
  maxAge: number; // Tiempo máximo en milisegundos
  strategy: 'cache-first' | 'network-first' | 'cache-only' | 'network-only';
}

export class CacheService {
  private readonly dbName = 'rout2me-cache';
  private readonly dbVersion = 1;
  private db: IDBDatabase | null = null;
  private readonly config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB por defecto
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días por defecto
      strategy: 'cache-first',
      ...config,
    };
  }

  /**
   * Inicializa la base de datos IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () =>
        reject(
          new Error(request.error?.message || 'Error al abrir base de datos'),
        );
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Crear store para caché de imágenes
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'key' });
          imageStore.createIndex('timestamp', 'timestamp');
          imageStore.createIndex('size', 'size');
        }

        // Crear store para metadatos del caché
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Obtiene un elemento del caché
   */
  async get(key: string): Promise<Blob | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as CacheItem | undefined;

        if (!result) {
          resolve(null);
          return;
        }

        // Verificar si el elemento ha expirado
        const now = Date.now();
        if (now - result.timestamp > this.config.maxAge) {
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };

      request.onerror = () =>
        reject(
          new Error(request.error?.message || 'Error al abrir base de datos'),
        );
    });
  }

  /**
   * Almacena un elemento en el caché
   */
  async set(key: string, data: Blob, type: string = 'image'): Promise<void> {
    if (!this.db) await this.init();

    const item: CacheItem = {
      key,
      data,
      timestamp: Date.now(),
      size: data.size,
      type,
    };

    // Verificar si necesitamos limpiar el caché
    await this.cleanupIfNeeded(data.size);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(
          new Error(request.error?.message || 'Error al abrir base de datos'),
        );
    });
  }

  /**
   * Elimina un elemento del caché
   */
  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(
          new Error(request.error?.message || 'Error al abrir base de datos'),
        );
    });
  }

  /**
   * Verifica si un elemento existe en el caché
   */
  async has(key: string): Promise<boolean> {
    const item = await this.get(key);
    return item !== null;
  }

  /**
   * Obtiene el tamaño total del caché
   */
  async getCacheSize(): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as CacheItem[];
        const totalSize = items.reduce((sum, item) => sum + item.size, 0);
        resolve(totalSize);
      };

      request.onerror = () =>
        reject(
          new Error(request.error?.message || 'Error al abrir base de datos'),
        );
    });
  }

  /**
   * Limpia elementos expirados del caché
   */
  async cleanupExpired(): Promise<void> {
    if (!this.db) await this.init();

    const now = Date.now();
    const expiredKeys: string[] = [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as CacheItem[];

        for (const item of items) {
          if (now - item.timestamp > this.config.maxAge) {
            expiredKeys.push(item.key);
          }
        }

        // Eliminar elementos expirados
        if (expiredKeys.length > 0) {
          const deleteTransaction = this.db!.transaction(
            ['images'],
            'readwrite',
          );
          const deleteStore = deleteTransaction.objectStore('images');

          for (const key of expiredKeys) {
            deleteStore.delete(key);
          }
        }

        resolve();
      };

      request.onerror = () =>
        reject(
          new Error(request.error?.message || 'Error al abrir base de datos'),
        );
    });
  }

  /**
   * Limpia el caché si es necesario para hacer espacio
   */
  private async cleanupIfNeeded(newItemSize: number): Promise<void> {
    const currentSize = await this.getCacheSize();

    if (currentSize + newItemSize > this.config.maxSize) {
      // Eliminar elementos más antiguos hasta tener espacio suficiente
      await this.cleanupOldestItems(
        currentSize + newItemSize - this.config.maxSize,
      );
    }
  }

  /**
   * Elimina los elementos más antiguos para liberar espacio
   */
  private async cleanupOldestItems(spaceNeeded: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => {
        const items = request.result as CacheItem[];

        // Ordenar por timestamp (más antiguos primero)
        items.sort((a, b) => a.timestamp - b.timestamp);

        let spaceFreed = 0;
        const keysToDelete: string[] = [];

        for (const item of items) {
          keysToDelete.push(item.key);
          spaceFreed += item.size;

          if (spaceFreed >= spaceNeeded) {
            break;
          }
        }

        // Eliminar elementos seleccionados
        for (const key of keysToDelete) {
          store.delete(key);
        }

        resolve();
      };

      request.onerror = () =>
        reject(
          new Error(request.error?.message || 'Error al abrir base de datos'),
        );
    });
  }

  /**
   * Limpia completamente el caché
   */
  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(
          new Error(request.error?.message || 'Error al abrir base de datos'),
        );
    });
  }

  /**
   * Obtiene estadísticas del caché
   */
  async getStats(): Promise<{
    totalSize: number;
    itemCount: number;
    oldestItem: number;
    newestItem: number;
  }> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as CacheItem[];

        if (items.length === 0) {
          resolve({
            totalSize: 0,
            itemCount: 0,
            oldestItem: 0,
            newestItem: 0,
          });
          return;
        }

        const totalSize = items.reduce((sum, item) => sum + item.size, 0);
        const timestamps = items.map((item) => item.timestamp);
        const oldestItem = Math.min(...timestamps);
        const newestItem = Math.max(...timestamps);

        resolve({
          totalSize,
          itemCount: items.length,
          oldestItem,
          newestItem,
        });
      };

      request.onerror = () =>
        reject(
          new Error(request.error?.message || 'Error al abrir base de datos'),
        );
    });
  }
}

// Instancia singleton del servicio de caché
export const cacheService = new CacheService({
  maxSize: 100 * 1024 * 1024, // 100MB para la aplicación
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
  strategy: 'cache-first',
});
