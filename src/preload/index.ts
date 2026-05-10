import { contextBridge, ipcRenderer } from 'electron';
import type { AppConfig } from '../shared/configTypes';
import type { SessionData } from '../main/session';

export interface ShellAPI {
  create(sessionId: string): Promise<{ pid: number; shell: string }>;
  resize(sessionId: string, cols: number, rows: number): Promise<void>;
  write(sessionId: string, data: string): Promise<void>;
  kill(sessionId: string): Promise<void>;
  onData(sessionId: string, callback: (data: string) => void): () => void;
  onExit(sessionId: string, callback: (code: number) => void): () => void;
}

export interface ConfigAPI {
  get(): Promise<AppConfig>;
  save(config: AppConfig): Promise<boolean>;
  getPath(): Promise<string>;
  openFolder(): Promise<string>;
  export(scope?: string): Promise<{ success: boolean; path?: string }>;
  import(): Promise<{ success: boolean; config?: AppConfig; error?: string }>;
}

export interface SessionAPI {
  save(data: SessionData): Promise<boolean>;
  load(): Promise<SessionData | null>;
  clear(): Promise<boolean>;
}

export interface HistoryAPI {
  record(data: { command: string; directory: string; sessionId: string; profile: string; exitCode: number | null }): Promise<any>;
  getAll(): Promise<any[]>;
  search(query: string): Promise<any[]>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<boolean>;
  toggleFavorite(id: string): Promise<boolean>;
  getFavorites(): Promise<any[]>;
  stats(): Promise<{ total: number; today: number; favorites: number; topCommands: Array<{ command: string; count: number }> }>;
}

const shellAPI: ShellAPI = {
  create: (sessionId) => ipcRenderer.invoke('shell:create', sessionId),
  resize: (sessionId, cols, rows) => ipcRenderer.invoke('shell:resize', sessionId, cols, rows),
  write: (sessionId, data) => ipcRenderer.invoke('shell:write', sessionId, data),
  kill: (sessionId) => ipcRenderer.invoke('shell:kill', sessionId),
  onData: (sessionId, callback) => {
    const channel = `shell:data:${sessionId}`;
    const handler = (_event: any, data: string) => callback(data);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
  onExit: (sessionId, callback) => {
    const channel = `shell:exit:${sessionId}`;
    const handler = (_event: any, code: number) => callback(code);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
};

const configAPI: ConfigAPI = {
  get: () => ipcRenderer.invoke('config:get'),
  save: (config) => ipcRenderer.invoke('config:save', config),
  getPath: () => ipcRenderer.invoke('config:getPath'),
  openFolder: () => ipcRenderer.invoke('config:openFolder'),
  export: (scope?: string) => ipcRenderer.invoke('config:export', scope),
  import: () => ipcRenderer.invoke('config:import'),
};

const sessionAPI: SessionAPI = {
  save: (data) => ipcRenderer.invoke('session:save', data),
  load: () => ipcRenderer.invoke('session:load'),
  clear: () => ipcRenderer.invoke('session:clear'),
};

const historyAPI: HistoryAPI = {
  record: (data) => ipcRenderer.invoke('history:record', data),
  getAll: () => ipcRenderer.invoke('history:getAll'),
  search: (query) => ipcRenderer.invoke('history:search', query),
  delete: (id) => ipcRenderer.invoke('history:delete', id),
  clear: () => ipcRenderer.invoke('history:clear'),
  toggleFavorite: (id) => ipcRenderer.invoke('history:toggleFavorite', id),
  getFavorites: () => ipcRenderer.invoke('history:getFavorites'),
  stats: () => ipcRenderer.invoke('history:stats'),
};

contextBridge.exposeInMainWorld('shellAPI', shellAPI);
contextBridge.exposeInMainWorld('configAPI', configAPI);
contextBridge.exposeInMainWorld('sessionAPI', sessionAPI);
contextBridge.exposeInMainWorld('historyAPI', historyAPI);

contextBridge.exposeInMainWorld('appAPI', {
  onReady: (callback: (windowId?: string) => void) => {
    ipcRenderer.on('terminal-ready', (_event, windowId) => callback(windowId));
  },
  openExternal: (url: string) => {
    ipcRenderer.invoke('shell:openExternal', url);
  },
  setTitle: (title: string) => {
    // Will be set via IPC in a real scenario
  },
});
