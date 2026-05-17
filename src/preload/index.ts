import { contextBridge, ipcRenderer } from 'electron';
import type { AppConfig } from '../shared/configTypes';
import type { SessionData } from '../main/session';

export interface ShellAPI {
  create(sessionId: string, shellType?: string, cwd?: string): Promise<{ pid: number; shell: string }>;
  resize(sessionId: string, cols: number, rows: number): Promise<void>;
  write(sessionId: string, data: string): Promise<void>;
  kill(sessionId: string): Promise<void>;
  onData(sessionId: string, callback: (data: string) => void): () => void;
  onExit(sessionId: string, callback: (code: number) => void): () => void;
  getDefaultType(): Promise<string>;
  setDefaultType(type: string): Promise<void>;
  onDefaultTypeChanged(callback: (type: string) => void): () => void;
  getCwd(sessionId: string): Promise<string>;
  onCwdChanged(sessionId: string, callback: (cwd: string) => void): () => void;
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
  onNewRecord(callback: (record: any) => void): () => void;
  exportHistory(excludePatterns?: string[]): Promise<boolean>;
}

const shellAPI: ShellAPI = {
  create: (sessionId, shellType, cwd) => ipcRenderer.invoke('shell:create', sessionId, shellType, cwd),
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
  getDefaultType: () => ipcRenderer.invoke('shell:getDefaultType'),
  setDefaultType: (type) => ipcRenderer.invoke('shell:setDefaultType', type),
  onDefaultTypeChanged: (callback) => {
    const handler = (_event: any, type: string) => callback(type);
    ipcRenderer.on('shell:defaultTypeChanged', handler);
    return () => ipcRenderer.removeListener('shell:defaultTypeChanged', handler);
  },
  getCwd: (sessionId) => ipcRenderer.invoke('shell:getCwd', sessionId),
  onCwdChanged: (sessionId, callback) => {
    const channel = `shell:cwd:${sessionId}`;
    const handler = (_event: any, cwd: string) => callback(cwd);
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
  onNewRecord: (callback) => {
    const handler = (_event: any, record: any) => callback(record);
    ipcRenderer.on('history:newRecord', handler);
    return () => ipcRenderer.removeListener('history:newRecord', handler);
  },
  exportHistory: (excludePatterns?: string[]) => ipcRenderer.invoke('history:export', excludePatterns),
};

contextBridge.exposeInMainWorld('shellAPI', shellAPI);
contextBridge.exposeInMainWorld('configAPI', configAPI);
contextBridge.exposeInMainWorld('sessionAPI', sessionAPI);
contextBridge.exposeInMainWorld('historyAPI', historyAPI);

export interface ClipboardAPI {
  write(text: string): Promise<void>;
  read(): Promise<string>;
}

const clipboardAPI: ClipboardAPI = {
  write: (text) => ipcRenderer.invoke('clipboard:write', text),
  read: () => ipcRenderer.invoke('clipboard:read'),
};

contextBridge.exposeInMainWorld('clipboardAPI', clipboardAPI);

export interface WindowAPI {
  reload(): Promise<void>;
  toggleDevTools(): Promise<void>;
  zoomIn(): Promise<void>;
  zoomOut(): Promise<void>;
  zoomReset(): Promise<void>;
  quit(): Promise<void>;
  copy(): Promise<void>;
  paste(): Promise<void>;
  selectAll(): Promise<void>;
}

const windowAPI: WindowAPI = {
  reload: () => ipcRenderer.invoke('window:reload'),
  toggleDevTools: () => ipcRenderer.invoke('window:toggleDevTools'),
  zoomIn: () => ipcRenderer.invoke('window:zoomIn'),
  zoomOut: () => ipcRenderer.invoke('window:zoomOut'),
  zoomReset: () => ipcRenderer.invoke('window:zoomReset'),
  quit: () => ipcRenderer.invoke('app:quit'),
  copy: () => ipcRenderer.invoke('window:copy'),
  paste: () => ipcRenderer.invoke('window:paste'),
  selectAll: () => ipcRenderer.invoke('window:selectAll'),
};

contextBridge.exposeInMainWorld('windowAPI', windowAPI);

export interface PromptAPI {
  getAll(): Promise<any[]>;
  save(template: any): Promise<any[]>;
  delete(id: string): Promise<boolean>;
}

const promptAPI: PromptAPI = {
  getAll: () => ipcRenderer.invoke('prompt:getAll'),
  save: (template) => ipcRenderer.invoke('prompt:save', template),
  delete: (id) => ipcRenderer.invoke('prompt:delete', id),
};

contextBridge.exposeInMainWorld('promptAPI', promptAPI);

export interface SessionPersistenceAPI {
  load(): Promise<{ tabs: Array<{ title: string; shell: string; cwd?: string }>; activeTabIndex: number; workspaceVisible: boolean; historyVisible: boolean }>;
  save(state: { tabs: Array<{ title: string; shell: string; cwd?: string }>; activeTabIndex: number; workspaceVisible: boolean; historyVisible: boolean }): Promise<void>;
}

const sessionPersistenceAPI: SessionPersistenceAPI = {
  load: () => ipcRenderer.invoke('persistence:loadState'),
  save: (state) => ipcRenderer.invoke('persistence:saveState', state),
};

contextBridge.exposeInMainWorld('sessionPersistenceAPI', sessionPersistenceAPI);

export interface WorkspaceAPI {
  getAll(): Promise<string[]>;
  save(folders: string[]): Promise<void>;
  selectFolder(): Promise<string[] | null>;
  revealInExplorer(folder: string): Promise<void>;
}

const workspaceAPI: WorkspaceAPI = {
  getAll: () => ipcRenderer.invoke('workspace:getAll'),
  save: (folders) => ipcRenderer.invoke('workspace:save', folders),
  selectFolder: () => ipcRenderer.invoke('workspace:selectFolder'),
  revealInExplorer: (folder) => ipcRenderer.invoke('workspace:revealInExplorer', folder),
};

contextBridge.exposeInMainWorld('workspaceAPI', workspaceAPI);

export interface RemoteAPI {
  pushSnapshot(sessionId: string, snapshot: any): Promise<void>;
  getRemoteUrl(): Promise<string>;
  getLanIp(): Promise<string>;
  isRunning(): Promise<boolean>;
  toggle(): Promise<boolean>;
  setActiveSession(sessionId: string): Promise<void>;
  getActiveSession(): Promise<string>;
}

const remoteAPI: RemoteAPI = {
  pushSnapshot: (sessionId, snapshot) => ipcRenderer.invoke('remote:pushSnapshot', sessionId, snapshot),
  getRemoteUrl: () => ipcRenderer.invoke('remote:getUrl'),
  getLanIp: () => ipcRenderer.invoke('remote:getLanIp'),
  isRunning: () => ipcRenderer.invoke('remote:isRunning'),
  toggle: () => ipcRenderer.invoke('remote:toggle'),
  setActiveSession: (sessionId) => ipcRenderer.invoke('remote:setActiveSession', sessionId),
  getActiveSession: () => ipcRenderer.invoke('remote:getActiveSession'),
};

contextBridge.exposeInMainWorld('remoteAPI', remoteAPI);

export interface RelayAPI {
  toggle(): Promise<{ connected: boolean; roomId: string; phoneUrl: string; error?: string }>;
  isConnected(): Promise<boolean>;
  getPhoneUrl(): Promise<string>;
  getRoomId(): Promise<string>;
  pushSnapshot(sessionId: string, snapshot: any): Promise<void>;
  pushSessions(): Promise<void>;
  onStatus(callback: (status: { connected: boolean; roomId: string }) => void): () => void;
}

const relayAPI: RelayAPI = {
  toggle: () => ipcRenderer.invoke('relay:toggle'),
  isConnected: () => ipcRenderer.invoke('relay:isConnected'),
  getPhoneUrl: () => ipcRenderer.invoke('relay:getPhoneUrl'),
  getRoomId: () => ipcRenderer.invoke('relay:getRoomId'),
  pushSnapshot: (sessionId, snapshot) => ipcRenderer.invoke('relay:pushSnapshot', sessionId, snapshot),
  pushSessions: () => ipcRenderer.invoke('relay:pushSessions'),
  onStatus: (callback) => {
    const handler = (_event: any, status: { connected: boolean; roomId: string }) => callback(status);
    ipcRenderer.on('relay:status', handler);
    return () => ipcRenderer.removeListener('relay:status', handler);
  },
};

contextBridge.exposeInMainWorld('relayAPI', relayAPI);

contextBridge.exposeInMainWorld('appAPI', {
  onReady: (callback: (windowId?: string) => void) => {
    ipcRenderer.on('terminal-ready', (_event, windowId) => callback(windowId));
  },
  onRemoteCreateTab: (callback: (shellType: string, cwd?: string) => void) => {
    const handler = (_event: any, data: { shell: string; cwd?: string } | string) => {
      // Support both old string-only and new object format
      if (typeof data === 'string') {
        callback(data);
      } else {
        callback(data.shell, data.cwd);
      }
    };
    ipcRenderer.on('remote:createTab', handler);
    return () => ipcRenderer.removeListener('remote:createTab', handler);
  },
  onRemoteActivateTab: (callback: (sessionId: string) => void) => {
    const handler = (_event: any, sessionId: string) => callback(sessionId);
    ipcRenderer.on('remote:activateTab', handler);
    return () => ipcRenderer.removeListener('remote:activateTab', handler);
  },
  onRemoteActivateWorkspace: (callback: (folder: string) => void) => {
    const handler = (_event: any, folder: string) => callback(folder);
    ipcRenderer.on('remote:activateWorkspace', handler);
    return () => ipcRenderer.removeListener('remote:activateWorkspace', handler);
  },
  openExternal: (url: string) => {
    ipcRenderer.invoke('shell:openExternal', url);
  },
  setTitle: (title: string) => {
    // Will be set via IPC in a real scenario
  },
});
