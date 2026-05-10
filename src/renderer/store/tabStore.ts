import { create } from 'zustand';

export interface TabInfo {
  id: string;
  title: string;
  sessionId: string;
  shell: string;
  pid: number;
}

interface TabState {
  tabs: TabInfo[];
  activeTabId: string | null;
  addTab: (info: Omit<TabInfo, 'id' | 'sessionId'> & { id?: string; sessionId?: string }) => TabInfo;
  removeTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  closeRightTabs: (id: string) => void;
  duplicateTab: (id: string) => TabInfo | null;
  setActiveTab: (id: string) => void;
  updateTabTitle: (id: string, title: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
}

function generateId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

let sessionCounter = 0;

function generateSessionId(): string {
  return `session-${Date.now()}-${++sessionCounter}`;
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: (info) => {
    const id = info.id || generateId();
    const sessionId = info.sessionId || generateSessionId();
    const tab: TabInfo = {
      id,
      sessionId,
      title: info.title || 'Terminal',
      shell: info.shell || '',
      pid: info.pid || 0,
    };
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
    }));
    return tab;
  },

  removeTab: (id) => {
    set((state) => {
      const tabs = state.tabs.filter((t) => t.id !== id);
      let activeTabId = state.activeTabId;
      if (activeTabId === id) {
        const idx = state.tabs.findIndex((t) => t.id === id);
        activeTabId = tabs[Math.min(idx, tabs.length - 1)]?.id || null;
      }
      return { tabs, activeTabId };
    });
  },

  closeOtherTabs: (id) => {
    set((state) => {
      const tab = state.tabs.find((t) => t.id === id);
      return {
        tabs: tab ? [tab] : [],
        activeTabId: id,
      };
    });
  },

  closeRightTabs: (id) => {
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.id === id);
      const tabs = state.tabs.slice(0, idx + 1);
      const activeTabId = state.tabs.find((t) => t.id === id)?.id || null;
      return { tabs, activeTabId };
    });
  },

  duplicateTab: (id) => {
    const state = get();
    const source = state.tabs.find((t) => t.id === id);
    if (!source) return null;
    const newTab = {
      id: generateId(),
      sessionId: generateSessionId(),
      title: `${source.title} (copy)`,
      shell: source.shell,
      pid: 0,
    };
    set((s) => ({
      tabs: [...s.tabs, newTab],
      activeTabId: newTab.id,
    }));
    return newTab;
  },

  setActiveTab: (id) => {
    set({ activeTabId: id });
  },

  updateTabTitle: (id, title) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, title } : t)),
    }));
  },

  reorderTabs: (fromIndex, toIndex) => {
    set((state) => {
      const tabs = [...state.tabs];
      const [moved] = tabs.splice(fromIndex, 1);
      tabs.splice(toIndex, 0, moved);
      return { tabs };
    });
  },
}));
