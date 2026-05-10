import type { ShellAPI, ConfigAPI, SessionAPI, HistoryAPI, ClipboardAPI, WindowAPI, PromptAPI, RemoteAPI, WorkspaceAPI, SessionPersistenceAPI } from '../preload/index';

declare global {
  interface Window {
    shellAPI: ShellAPI;
    configAPI: ConfigAPI;
    sessionAPI: SessionAPI;
    historyAPI: HistoryAPI;
    clipboardAPI: ClipboardAPI;
    windowAPI: WindowAPI;
    promptAPI: PromptAPI;
    remoteAPI: RemoteAPI & { setActiveSession(sessionId: string): Promise<void>; getActiveSession(): Promise<string>; };
    workspaceAPI: WorkspaceAPI;
    sessionPersistenceAPI: SessionPersistenceAPI;
    appAPI: {
      onReady: (callback: (windowId?: string) => void) => void;
      onRemoteCreateTab: (callback: (shellType: string, cwd?: string) => void) => () => void;
      onRemoteActivateTab: (callback: (sessionId: string) => void) => () => void;
      onRemoteActivateWorkspace: (callback: (folder: string) => void) => () => void;
      openExternal: (url: string) => void;
      setTitle: (title: string) => void;
    };
  }
}
