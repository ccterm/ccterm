import type { ShellAPI, ConfigAPI, SessionAPI, HistoryAPI, ClipboardAPI, MenuAPI, PromptAPI, WorkspaceAPI, SessionPersistenceAPI } from '../preload/index';

declare global {
  interface Window {
    shellAPI: ShellAPI;
    configAPI: ConfigAPI;
    sessionAPI: SessionAPI;
    historyAPI: HistoryAPI;
    clipboardAPI: ClipboardAPI;
    menuAPI: MenuAPI;
    promptAPI: PromptAPI;
    workspaceAPI: WorkspaceAPI;
    sessionPersistenceAPI: SessionPersistenceAPI;
    appAPI: {
      onReady: (callback: (windowId?: string) => void) => void;
      openExternal: (url: string) => void;
      setTitle: (title: string) => void;
    };
  }
}
