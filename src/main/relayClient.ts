import * as crypto from 'crypto';
import WebSocket from 'ws';
import { BrowserWindow, ipcMain } from 'electron';
import { addCommand, saveSnapshot } from './remoteServer';

let ws: WebSocket | null = null;
let roomId = '';
let connected = false;
let relayServerUrl = '';
let relayToken = '';
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000;

export function getRelayRoomId(): string {
  return roomId;
}

export function isRelayConnected(): boolean {
  return connected;
}

export function getRelayServerUrl(): string {
  return relayServerUrl;
}

export function getRelayPhoneUrl(): string {
  if (!relayServerUrl || !roomId) return '';
  return `${relayServerUrl.replace(/\/$/, '')}/phone?room=${encodeURIComponent(roomId)}`;
}

function generateRoomId(): string {
  return crypto.randomBytes(12).toString('base64url');
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  console.log(`[CCTerm Relay] Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1})...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectAttempts++;
    doConnect();
  }, delay);
}

function doConnect(): void {
  if (!relayServerUrl) return;

  const wsUrl = relayServerUrl
    .replace(/^http/, 'ws')
    .replace(/\/$/, '');
  const url = `${wsUrl}?room=${encodeURIComponent(roomId)}&role=desktop`;

  try {
    ws = new WebSocket(url);
  } catch (err: any) {
    console.error('[CCTerm Relay] Failed to create WebSocket:', err.message);
    scheduleReconnect();
    return;
  }

  ws.on('open', () => {
    console.log(`[CCTerm Relay] Connected to ${relayServerUrl} (room: ${roomId.slice(0, 8)}...)`);
    connected = true;
    reconnectAttempts = 0;

    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
        win.webContents.send('relay:status', { connected: true, roomId });
      }
    });
  });

  ws.on('message', (data: WebSocket.Data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleRelayMessage(msg);
    } catch {
      // ignore malformed messages
    }
  });

  ws.on('close', (code: number) => {
    console.log(`[CCTerm Relay] Disconnected (code: ${code})`);
    connected = false;
    ws = null;

    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
        win.webContents.send('relay:status', { connected: false, roomId });
      }
    });

    scheduleReconnect();
  });

  ws.on('error', (err: Error) => {
    console.error('[CCTerm Relay] WebSocket error:', err.message);
  });
}

function handleRelayMessage(msg: any): void {
  switch (msg.type) {
    case 'command': {
      // Focus terminal window before processing command
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) win.focus();
      });
      addCommand(msg.sessionId || '', msg.text || '', msg.sendEnter ?? true);
      break;
    }

    case 'setActiveSession': {
      if (msg.sessionId) {
        BrowserWindow.getAllWindows().forEach((win) => {
          if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
            win.webContents.send('remote:activateTab', msg.sessionId);
          }
        });
      }
      break;
    }

    case 'createTab': {
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
          win.webContents.send('remote:createTab', {
            shell: msg.shell || 'powershell',
            cwd: msg.cwd || undefined,
          });
        }
      });
      break;
    }

    case 'activateWorkspace': {
      if (typeof msg.index === 'number' && msg.folder) {
        BrowserWindow.getAllWindows().forEach((win) => {
          if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
            win.webContents.send('remote:activateWorkspace', msg.folder);
          }
        });
      }
      break;
    }

    case 'requestSessions': {
      // Phone requests session list — we import lazily to avoid circular deps
      const { getAllSessions, getActiveSessionId } = require('./remoteServer');
      sendRelayMessage({
        type: 'sessions',
        data: getAllSessions(),
        activeSessionId: getActiveSessionId(),
      });
      break;
    }

    case 'requestSnapshot': {
      const { getSnapshot } = require('./remoteServer');
      const snap = getSnapshot(msg.sessionId);
      sendRelayMessage({
        type: 'snapshot',
        sessionId: msg.sessionId,
        data: snap,
      });
      break;
    }

    case 'requestHistory': {
      const { loadHistory } = require('./history');
      const store = loadHistory();
      const q = (msg.query || '').toLowerCase();
      let records = store.records;
      if (q) {
        records = records.filter((r: any) => r.command.toLowerCase().includes(q));
      }
      sendRelayMessage({
        type: 'history',
        data: records.slice(0, msg.limit || 100),
      });
      break;
    }

    case 'requestWorkspace': {
      const { getWorkspaceFolders } = require('./workspace');
      sendRelayMessage({
        type: 'workspace',
        data: getWorkspaceFolders(),
      });
      break;
    }

    case 'requestPrompts': {
      const { getAllPrompts } = require('./promptTool');
      sendRelayMessage({
        type: 'prompts',
        data: getAllPrompts(),
      });
      break;
    }
  }
}

export function sendRelayMessage(msg: object): void {
  if (!ws || !connected) return;
  try {
    ws.send(JSON.stringify(msg));
  } catch (err: any) {
    console.error('[CCTerm Relay] Send error:', err.message);
  }
}

export function connectRelay(serverUrl: string, token: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (ws && connected) {
      // Already connected — just return room
      resolve(roomId);
      return;
    }

    relayServerUrl = serverUrl;
    relayToken = token;
    roomId = generateRoomId();
    reconnectAttempts = 0;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    const wsUrl = serverUrl
      .replace(/^http/, 'ws')
      .replace(/\/$/, '');
    const url = `${wsUrl}?room=${encodeURIComponent(roomId)}&role=desktop`;

    try {
      ws = new WebSocket(url);
    } catch (err: any) {
      reject(err);
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 10000);

    ws.on('open', () => {
      clearTimeout(timeout);
      console.log(`[CCTerm Relay] Connected to ${serverUrl} (room: ${roomId.slice(0, 8)}...)`);
      connected = true;
      reconnectAttempts = 0;
      resolve(roomId);
    });

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString());
        handleRelayMessage(msg);
      } catch { /* ignore */ }
    });

    ws.on('close', (code: number) => {
      console.log(`[CCTerm Relay] Disconnected (code: ${code})`);
      connected = false;
      ws = null;

      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
          win.webContents.send('relay:status', { connected: false, roomId });
        }
      });

      scheduleReconnect();
    });

    ws.on('error', (err: Error) => {
      clearTimeout(timeout);
      console.error('[CCTerm Relay] WebSocket error:', err.message);
    });
  });
}

export function disconnectRelay(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  connected = false;
  roomId = '';
  relayServerUrl = '';
  relayToken = '';

  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
      win.webContents.send('relay:status', { connected: false, roomId: '' });
    }
  });
}

// Register IPC handlers for relay
export function setupRelayHandlers(): void {
  ipcMain.handle('relay:toggle', async () => {
    if (connected) {
      disconnectRelay();
      return { connected: false, roomId: '', phoneUrl: '' };
    }
    // Read config for relay settings
    const { getConfig } = require('./config');
    const config = getConfig();
    const rc = config.remoteControl;
    try {
      await connectRelay(rc.relayServerUrl || 'ws://localhost:8080', rc.relayToken || '');
      return { connected: true, roomId, phoneUrl: getRelayPhoneUrl() };
    } catch (err: any) {
      return { connected: false, roomId: '', phoneUrl: '', error: err.message };
    }
  });

  ipcMain.handle('relay:isConnected', () => connected);

  ipcMain.handle('relay:getPhoneUrl', () => getRelayPhoneUrl());

  ipcMain.handle('relay:getRoomId', () => roomId);

  // When renderer pushes a snapshot, also relay it via WebSocket
  ipcMain.handle('relay:pushSnapshot', (_event, sessionId: string, snapshot: any) => {
    saveSnapshot(sessionId, snapshot);
    if (connected && ws) {
      sendRelayMessage({ type: 'snapshot', sessionId, data: snapshot });
    }
  });

  // Relay session list to phone
  ipcMain.handle('relay:pushSessions', () => {
    if (!connected) return;
    const { getAllSessions, getActiveSessionId } = require('./remoteServer');
    sendRelayMessage({
      type: 'sessions',
      data: getAllSessions(),
      activeSessionId: getActiveSessionId(),
    });
  });
}
