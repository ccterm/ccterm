import express from 'express';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { BrowserWindow, ipcMain } from 'electron';
import { getWorkspaceFolders } from './workspace';
import { loadHistory } from './history';

interface PendingCommand {
  id: string;
  text: string;
  sendEnter: boolean;
  timestamp: number;
}

interface SessionState {
  snapshot: any | null;
  commands: PendingCommand[];
}

let server: http.Server | null = null;
let token = '';
let activeSessionId = '';
let pendingActiveSessionId = '';
let pendingCreateTab = '';
const sessions = new Map<string, SessionState>();

export function getActiveSessionId(): string {
  return activeSessionId;
}

export function setActiveSessionId(id: string): void {
  activeSessionId = id;
}

export function getPendingActiveSessionId(): string {
  return pendingActiveSessionId;
}

export function clearPendingActiveSessionId(): void {
  pendingActiveSessionId = '';
}

export function getPendingCreateTab(): string {
  return pendingCreateTab;
}

export function clearPendingCreateTab(): void {
  pendingCreateTab = '';
}

export function getRemoteServerPort(): number {
  return server ? (server.address() as any)?.port : 0;
}

export function getRemoteToken(): string {
  return token;
}

export function getAllSessions(): Array<{ id: string; tabTitle: string; cwd: string }> {
  const list: Array<{ id: string; tabTitle: string; cwd: string }> = [];
  for (const [id, s] of sessions) {
    list.push({
      id,
      tabTitle: s.snapshot?.tabTitle || id,
      cwd: s.snapshot?.cwd || '',
    });
  }
  return list;
}

export function getSnapshot(sessionId: string): any | null {
  return sessions.get(sessionId)?.snapshot || null;
}

export function saveSnapshot(sessionId: string, snapshot: any): void {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { snapshot: null, commands: [] });
  }
  sessions.get(sessionId)!.snapshot = { ...snapshot, receivedAt: Date.now() };
}

export function getCommands(sessionId: string): PendingCommand[] {
  return sessions.get(sessionId)?.commands || [];
}

export function addCommand(sessionId: string, text: string, sendEnter: boolean): void {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { snapshot: null, commands: [] });
  }
  sessions.get(sessionId)!.commands.push({
    id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: text || '',
    sendEnter: sendEnter ?? true,
    timestamp: Date.now(),
  });
}

export function clearCommands(sessionId: string): void {
  const s = sessions.get(sessionId);
  if (s) s.commands = [];
}

function getPhoneClientPath(): string {
  // In dev: phone-client/ is in project root
  // In production: bundled in resources
  const devPath = path.join(__dirname, '..', '..', 'phone-client');
  if (fs.existsSync(devPath)) return devPath;
  // Fallback for packaged app
  return path.join(process.resourcesPath || '', 'phone-client');
}

export function startRemoteServer(port: number, authToken: string): Promise<number> {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close();
      server = null;
    }
    token = authToken;

    const app = express();
    app.use(express.json());

    // Auth middleware
    if (token) {
      app.use('/api', (req, res, next) => {
        if (req.path === '/api/auth') return next();
        const auth = req.headers.authorization;
        if (auth !== `Bearer ${token}`) {
          return res.status(401).json({ error: 'unauthorized' });
        }
        next();
      });
    }

    // Phone client static files
    app.use('/phone', express.static(getPhoneClientPath()));

    // API: auth
    app.post('/api/auth', (req, res) => {
      if (!token || req.body.token === token) {
        return res.json({ ok: true });
      }
      res.status(401).json({ error: 'bad token' });
    });

    // API: server status
    app.get('/api/status', (_req, res) => {
      res.json({ ok: true, sessions: sessions.size });
    });

    // API: sessions list
    app.get('/api/sessions', (_req, res) => {
      res.json(getAllSessions());
    });

    // API: upload snapshot
    app.post('/api/sessions/:id/snapshot', (req, res) => {
      saveSnapshot(req.params.id, req.body);
      res.json({ ok: true });
    });

    // API: get snapshot
    app.get('/api/sessions/:id/snapshot', (req, res) => {
      res.json(getSnapshot(req.params.id));
    });

    // API: send command (phone → terminal)
    app.post('/api/sessions/:id/commands', (req, res) => {
      const { text, sendEnter } = req.body;
      if (!text && sendEnter !== true) {
        return res.status(400).json({ error: 'empty' });
      }
      addCommand(req.params.id, text || '', sendEnter ?? true);
      res.json({ ok: true });
    });

    // API: get commands (terminal polls this)
    app.get('/api/sessions/:id/commands', (req, res) => {
      res.json(getCommands(req.params.id));
    });

    // API: clear commands
    app.delete('/api/sessions/:id/commands/all', (req, res) => {
      clearCommands(req.params.id);
      res.json({ ok: true });
    });

    // API: workspace folders
    app.get('/api/workspace', (_req, res) => {
      res.json(getWorkspaceFolders());
    });

    // API: history records
    app.get('/api/history', (req, res) => {
      const store = loadHistory();
      const q = (req.query.q as string) || '';
      let records = store.records;
      if (q) {
        const lower = q.toLowerCase();
        records = records.filter((r) => r.command.toLowerCase().includes(lower));
      }
      const limit = parseInt(req.query.limit as string) || 100;
      res.json(records.slice(0, limit));
    });

    // API: create new tab (phone → desktop)
    app.post('/api/tabs', (req, res) => {
      const { shell: shellType } = req.body;
      console.log('[CCTerm] POST /api/tabs shell:', shellType);
      pendingCreateTab = shellType || 'powershell';
      res.json({ ok: true });
    });

    // API: get active session
    app.get('/api/sessions/active', (_req, res) => {
      res.json({ sessionId: activeSessionId });
    });

    // API: set active session (phone → desktop)
    app.post('/api/sessions/active', (req, res) => {
      const { sessionId } = req.body;
      console.log('[CCTerm] POST /api/sessions/active body:', req.body);
      if (sessionId) {
        activeSessionId = sessionId;
        pendingActiveSessionId = sessionId;
        console.log('[CCTerm] Active session set to:', sessionId, '(pending push to desktop)');
        res.json({ ok: true });
      } else {
        res.status(400).json({ error: 'missing sessionId' });
      }
    });

    server = app.listen(port, '0.0.0.0', () => {
      const addr = server!.address() as any;
      console.log('[CCTerm] Remote server listening on port', addr.port);
      resolve(addr.port);
    });

    server.on('error', (err: any) => {
      console.error('[CCTerm] Remote server error:', err.message);
      reject(err);
    });
  });
}

// Register IPC handlers for renderer
import { startRemoteSync, stopRemoteSync } from './remoteSync';
import type { AppConfig } from '../shared/configTypes';

let activeConfig: AppConfig | null = null;

export function setActiveRemoteConfig(cfg: AppConfig): void {
  activeConfig = cfg;
}

// Register IPC handlers for renderer
export function setupRemoteHandlers(): void {
  ipcMain.handle('remote:getUrl', () => getRemoteUrl());
  ipcMain.handle('remote:getLanIp', () => getLanIp());
  ipcMain.handle('remote:isRunning', () => server !== null);
  ipcMain.handle('remote:setActiveSession', (_event, sessionId: string) => {
    if (sessions.has(sessionId)) {
      activeSessionId = sessionId;
    }
  });
  ipcMain.handle('remote:toggle', async () => {
    if (server) {
      stopRemoteSync();
      stopRemoteServer();
      return false;
    }
    const cfg = activeConfig?.remoteControl || { enabled: false, port: 3001, token: '', syncInterval: 2000 };
    try {
      await startRemoteServer(cfg.port, cfg.token);
      startRemoteSync(cfg.syncInterval);
      return true;
    } catch {
      return false;
    }
  });
}

export function stopRemoteServer(): void {
  if (server) {
    server.close();
    server = null;
    console.log('[CCTerm] Remote server stopped');
  }
}

export function getLanIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }
  return '127.0.0.1';
}

export function getRemoteUrl(): string {
  const port = server ? (server.address() as any)?.port : 3001;
  const ip = getLanIp();
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  return `http://${ip}:${port}/phone${tokenParam}`;
}
