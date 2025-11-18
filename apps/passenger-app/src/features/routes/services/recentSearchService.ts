export type RecentSearchType = 'route' | 'stop';

export interface RecentSearchEntry {
  id: string;
  type: RecentSearchType;
}

export const recentSearchesStorage = {
  STORAGE_KEY: 'rout2me_recent_searches',
  MAX_ITEMS: 10,

  saveRecentSearch(entry: RecentSearchEntry): void {
    try {
      const currentEntries = this.getRecentSearches();

      const filtered = currentEntries.filter(
        (item) => !(item.id === entry.id && item.type === entry.type),
      );

      const updated = [entry, ...filtered].slice(0, this.MAX_ITEMS);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error guardando búsqueda reciente:', error);
    }
  },

  getRecentSearches(): RecentSearchEntry[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (item): item is RecentSearchEntry =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.id === 'string' &&
          (item.type === 'route' || item.type === 'stop'),
      );
    } catch (error) {
      console.error('Error obteniendo búsquedas recientes:', error);
      return [];
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error limpiando búsquedas recientes:', error);
    }
  },
};
