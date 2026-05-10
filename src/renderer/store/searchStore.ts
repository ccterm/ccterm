import { create } from 'zustand';
import { SearchAddon } from '@xterm/addon-search';

interface SearchState {
  isOpen: boolean;
  searchAddons: Map<string, SearchAddon>;
  query: string;
  caseSensitive: boolean;
  regex: boolean;
  wholeWord: boolean;

  open: () => void;
  close: () => void;
  toggle: () => void;
  registerAddon: (sessionId: string, addon: SearchAddon) => void;
  unregisterAddon: (sessionId: string) => void;
  setQuery: (q: string) => void;
  setCaseSensitive: (v: boolean) => void;
  setRegex: (v: boolean) => void;
  setWholeWord: (v: boolean) => void;
  findNext: (sessionId: string) => void;
  findPrev: (sessionId: string) => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  isOpen: false,
  searchAddons: new Map(),
  query: '',
  caseSensitive: false,
  regex: false,
  wholeWord: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: '' }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  registerAddon: (sessionId, addon) => {
    set((s) => {
      const map = new Map(s.searchAddons);
      map.set(sessionId, addon);
      return { searchAddons: map };
    });
  },

  unregisterAddon: (sessionId) => {
    set((s) => {
      const map = new Map(s.searchAddons);
      map.delete(sessionId);
      return { searchAddons: map };
    });
  },

  setQuery: (query) => set({ query }),

  setCaseSensitive: (caseSensitive) => {
    set({ caseSensitive });
    const { query, searchAddons, isOpen } = get();
    if (isOpen && query) {
      searchAddons.forEach((addon) => {
        addon.findOptions?.({ caseSensitive, regex: get().regex, wholeWord: get().wholeWord });
      });
    }
  },

  setRegex: (regex) => {
    set({ regex });
    const { query, searchAddons, isOpen } = get();
    if (isOpen && query) {
      searchAddons.forEach((addon) => {
        addon.findOptions?.({ regex, caseSensitive: get().caseSensitive, wholeWord: get().wholeWord });
      });
    }
  },

  setWholeWord: (wholeWord) => {
    set({ wholeWord });
    const { query, searchAddons, isOpen } = get();
    if (isOpen && query) {
      searchAddons.forEach((addon) => {
        addon.findOptions?.({ wholeWord, caseSensitive: get().caseSensitive, regex: get().regex });
      });
    }
  },

  findNext: (sessionId) => {
    const { searchAddons, query, caseSensitive, regex, wholeWord } = get();
    const addon = searchAddons.get(sessionId);
    if (addon && query) {
      addon.findNext(query, { caseSensitive, regex, wholeWord });
    }
  },

  findPrev: (sessionId) => {
    const { searchAddons, query, caseSensitive, regex, wholeWord } = get();
    const addon = searchAddons.get(sessionId);
    if (addon && query) {
      addon.findPrevious(query, { caseSensitive, regex, wholeWord });
    }
  },
}));
