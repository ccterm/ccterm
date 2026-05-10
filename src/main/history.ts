import { app, ipcMain, BrowserWindow, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { getSessionCwd } from './shell';

export interface CommandRecord {
  id: string;
  command: string;
  timestamp: number;
  directory: string;
  sessionId: string;
  profile: string;
  exitCode: number | null;
  favorite: boolean;
}

interface HistoryStore {
  records: CommandRecord[];
  maxRecords: number;
}

function getHistoryPath(): string {
  return path.join(app.getPath('userData'), 'command-history.json');
}

let historyCache: HistoryStore | null = null;

function loadHistory(): HistoryStore {
  if (historyCache) return historyCache;
  try {
    const filePath = getHistoryPath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      historyCache = JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  if (!historyCache) {
    historyCache = { records: [], maxRecords: 10000 };
  }
  return historyCache;
}

function saveHistory(): void {
  if (!historyCache) return;
  try {
    const filePath = getHistoryPath();
    fs.writeFileSync(filePath, JSON.stringify(historyCache, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

function generateId(): string {
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function setupHistoryHandlers(): void {
  ipcMain.handle('history:record', (_event, record: Omit<CommandRecord, 'id' | 'timestamp'>) => {
    const store = loadHistory();
    // Auto-fill directory from active session's CWD
    const directory = record.directory || getSessionCwd(record.sessionId);
    const newRecord: CommandRecord = {
      ...record,
      directory,
      id: generateId(),
      timestamp: Date.now(),
    };
    store.records.unshift(newRecord);

    // Trim to max records
    if (store.records.length > store.maxRecords) {
      store.records = store.records.slice(0, store.maxRecords);
    }

    saveHistory();

    // Notify all windows of the new record
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
        win.webContents.send('history:newRecord', newRecord);
      }
    });

    return newRecord;
  });

  ipcMain.handle('history:getAll', () => {
    const store = loadHistory();
    return store.records;
  });

  ipcMain.handle('history:search', (_event, query: string) => {
    const store = loadHistory();
    const q = query.toLowerCase();
    return store.records.filter((r) => r.command.toLowerCase().includes(q));
  });

  ipcMain.handle('history:delete', (_event, id: string) => {
    const store = loadHistory();
    store.records = store.records.filter((r) => r.id !== id);
    saveHistory();
    return true;
  });

  ipcMain.handle('history:clear', () => {
    const store = loadHistory();
    store.records = [];
    saveHistory();
    return true;
  });

  ipcMain.handle('history:toggleFavorite', (_event, id: string) => {
    const store = loadHistory();
    const record = store.records.find((r) => r.id === id);
    if (record) {
      record.favorite = !record.favorite;
      saveHistory();
      return record.favorite;
    }
    return false;
  });

  ipcMain.handle('history:getFavorites', () => {
    const store = loadHistory();
    return store.records.filter((r) => r.favorite);
  });

  ipcMain.handle('history:stats', () => {
    const store = loadHistory();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();

    const todayCommands = store.records.filter((r) => r.timestamp >= todayTs);
    const commandCounts = new Map<string, number>();
    store.records.forEach((r) => {
      const cmd = r.command.split(/\s+/)[0] || r.command;
      commandCounts.set(cmd, (commandCounts.get(cmd) || 0) + 1);
    });
    const topCommands = [...commandCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([command, count]) => ({ command, count }));

    return {
      total: store.records.length,
      today: todayCommands.length,
      favorites: store.records.filter((r) => r.favorite).length,
      topCommands,
    };
  });

  ipcMain.handle('history:export', async (_event, excludePatterns?: string[]) => {
    const store = loadHistory();
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return false;

    const result = await dialog.showSaveDialog(win, {
      title: 'Export Command History',
      defaultPath: `ccterm-history-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'Text', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (!result.canceled && result.filePath) {
      let records = store.records;
      if (excludePatterns && excludePatterns.length > 0) {
        records = records.filter((r) => {
          const cmd = r.command.toLowerCase();
          return !excludePatterns.some((p) => p.trim() && cmd.includes(p.trim().toLowerCase()));
        });
      }
      const data = JSON.stringify(records, null, 2);
      fs.writeFileSync(result.filePath, data, 'utf-8');
      return true;
    }
    return false;
  });
}
