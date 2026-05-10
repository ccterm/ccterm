import { app, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

interface PersistedTab {
  title: string;
  shell: string;
  cwd?: string;
}

interface SessionState {
  tabs: PersistedTab[];
  activeTabIndex: number;
  workspaceVisible: boolean;
  historyVisible: boolean;
}

function getStorePath(): string {
  return path.join(app.getPath('userData'), 'session-state.json');
}

let state: SessionState = { tabs: [], activeTabIndex: -1, workspaceVisible: false, historyVisible: false };

export function loadSessionState(): SessionState {
  try {
    const p = getStorePath();
    if (fs.existsSync(p)) {
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
      state = {
        tabs: raw.tabs || [],
        activeTabIndex: raw.activeTabIndex ?? -1,
        workspaceVisible: raw.workspaceVisible || false,
        historyVisible: raw.historyVisible || false,
      };
    }
  } catch { /* ignore */ }
  return state;
}

export function saveSessionState(s: SessionState): void {
  state = s;
  try {
    fs.writeFileSync(getStorePath(), JSON.stringify(s, null, 2), 'utf-8');
  } catch { /* ignore */ }
}

export function getWorkspaceVisible(): boolean {
  return state.workspaceVisible;
}

export function getHistoryVisible(): boolean {
  return state.historyVisible;
}

export function setupSessionPersistenceHandlers(): void {
  ipcMain.handle('persistence:loadState', () => {
    return loadSessionState();
  });

  ipcMain.handle('persistence:saveState', (_event, s: SessionState) => {
    saveSessionState(s);
  });
}
