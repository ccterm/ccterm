import { create } from 'zustand';

interface WorkspaceState {
  visible: boolean;
  folders: string[];
  activeFolder: string | null;
  setVisible: (v: boolean) => void;
  toggleVisible: () => void;
  setFolders: (folders: string[]) => void;
  addFolder: (path: string | string[]) => void;
  removeFolder: (path: string) => void;
  setActiveFolder: (path: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  visible: false,
  folders: [],
  activeFolder: null,

  setVisible: (v) => set({ visible: v }),
  toggleVisible: () => set((s) => ({ visible: !s.visible })),

  setFolders: (folders) => set({ folders }),

  addFolder: (pathOrPaths) => {
    const { folders } = get();
    const paths = Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths];
    const newPaths = paths.filter((p) => !folders.includes(p));
    if (newPaths.length === 0) return;
    const updated = [...folders, ...newPaths];
    set({ folders: updated, activeFolder: get().activeFolder || newPaths[0] });
    window.workspaceAPI.save(updated);
  },

  removeFolder: (path) => {
    const updated = get().folders.filter((f) => f !== path);
    set({ folders: updated, activeFolder: get().activeFolder === path ? null : get().activeFolder });
    window.workspaceAPI.save(updated);
  },

  setActiveFolder: (path) => set({ activeFolder: path }),
}));
