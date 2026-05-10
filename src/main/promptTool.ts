import { app, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface PromptTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: number;
  updatedAt: number;
}

interface PromptStore {
  prompts: PromptTemplate[];
}

function getStorePath(): string {
  return path.join(app.getPath('userData'), 'prompt-templates.json');
}

let cache: PromptStore | null = null;

function loadStore(): PromptStore {
  if (cache) return cache;
  try {
    const p = getStorePath();
    if (fs.existsSync(p)) {
      cache = JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch { /* ignore */ }
  if (!cache) cache = { prompts: [] };
  return cache;
}

function saveStore(): void {
  try {
    fs.writeFileSync(getStorePath(), JSON.stringify(cache, null, 2), 'utf-8');
  } catch { /* ignore */ }
}

function generateId(): string {
  return `pt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function setupPromptToolHandlers(): void {
  ipcMain.handle('prompt:getAll', () => {
    return loadStore().prompts;
  });

  ipcMain.handle('prompt:save', (_event, template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const store = loadStore();
    const now = Date.now();
    if (template.id) {
      const idx = store.prompts.findIndex((p) => p.id === template.id);
      if (idx >= 0) {
        store.prompts[idx] = { ...store.prompts[idx], ...template, updatedAt: now };
      }
    } else {
      store.prompts.push({
        ...template,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      });
    }
    saveStore();
    return store.prompts;
  });

  ipcMain.handle('prompt:delete', (_event, id: string) => {
    const store = loadStore();
    store.prompts = store.prompts.filter((p) => p.id !== id);
    saveStore();
    return true;
  });
}
