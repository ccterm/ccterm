import { app, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface SessionPaneData {
  type: 'terminal';
  id: string;
  sessionId: string;
}

export interface SessionSplitData {
  type: 'split';
  id: string;
  direction: 'horizontal' | 'vertical';
  children: SessionNodeData[];
  sizes: number[];
}

export type SessionNodeData = SessionPaneData | SessionSplitData;

export interface SessionTabData {
  id: string;
  title: string;
  sessionId: string;
  paneRoot: SessionNodeData | null;
}

export interface SessionWindowData {
  tabs: SessionTabData[];
  activeTabId: string | null;
  width: number;
  height: number;
  x?: number;
  y?: number;
}

export interface SessionData {
  version: number;
  windows: SessionWindowData[];
}

function getSessionPath(): string {
  return path.join(app.getPath('userData'), 'session.json');
}

export function saveSession(session: SessionData): void {
  try {
    const filePath = getSessionPath();
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
  } catch {
    // Silently fail - session save is not critical
  }
}

export function loadSession(): SessionData | null {
  try {
    const filePath = getSessionPath();
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    const filePath = getSessionPath();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // ignore
  }
}

export function setupSessionHandlers(): void {
  ipcMain.handle('session:save', (_event, session: SessionData) => {
    saveSession(session);
    return true;
  });

  ipcMain.handle('session:load', () => {
    return loadSession();
  });

  ipcMain.handle('session:clear', () => {
    clearSession();
    return true;
  });
}
