import type { ShellAPI, ConfigAPI, SessionAPI, HistoryAPI, ClipboardAPI } from '../preload/index';

declare global {
  interface Window {
    shellAPI: ShellAPI;
    configAPI: ConfigAPI;
    sessionAPI: SessionAPI;
    historyAPI: HistoryAPI;
    clipboardAPI: ClipboardAPI;
    appAPI: {
      onReady: (callback: (windowId?: string) => void) => void;
      openExternal: (url: string) => void;
      setTitle: (title: string) => void;
    };
  }
}
