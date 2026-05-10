import { app, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

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
    const newRecord: CommandRecord = {
      ...record,
      id: generateId(),
      timestamp: Date.now(),
    };
    store.records.unshift(newRecord);

    // Trim to max records
    if (store.records.length > store.maxRecords) {
      store.records = store.records.slice(0, store.maxRecords);
    }

    saveHistory();
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
}
