import { app, BrowserWindow, clipboard, ipcMain, Menu } from 'electron';
import { setupShellHandlers, killAllSessions } from './shell';
import { setupConfigHandlers } from './config';
import { setupSessionHandlers } from './session';
import { setupQuakeMode, destroyQuakeMode } from './quake';
import { setupWindowManager, createTerminalWindow } from './windowManager';
import { setupHistoryHandlers } from './history';
import { setupPromptToolHandlers } from './promptTool';
import { setupWorkspaceHandlers, setWorkspaceVisible } from './workspace';
import { setupSessionPersistenceHandlers, loadSessionState } from './sessionPersistence';
import { startRemoteServer, stopRemoteServer, setupRemoteHandlers, setActiveRemoteConfig } from './remoteServer';
import { startRemoteSync, stopRemoteSync } from './remoteSync';
import { setupRelayHandlers, connectRelay, disconnectRelay } from './relayClient';
import { getConfig } from './config';

ipcMain.handle('shell:openExternal', (_event, url: string) => {
  const { shell } = require('electron');
  shell.openExternal(url);
});

ipcMain.handle('clipboard:write', (_event, text: string) => {
  clipboard.writeText(text);
});

ipcMain.handle('clipboard:read', () => {
  return clipboard.readText();
});

// Window action handlers (replaces native menu roles)
ipcMain.handle('window:reload', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win && !win.isDestroyed()) win.webContents.reload();
});

ipcMain.handle('window:toggleDevTools', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win && !win.isDestroyed()) win.webContents.toggleDevTools();
});

ipcMain.handle('window:zoomIn', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win && !win.isDestroyed()) {
    const current = win.webContents.getZoomLevel();
    win.webContents.setZoomLevel(current + 0.5);
  }
});

ipcMain.handle('window:zoomOut', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win && !win.isDestroyed()) {
    const current = win.webContents.getZoomLevel();
    win.webContents.setZoomLevel(current - 0.5);
  }
});

ipcMain.handle('window:zoomReset', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win && !win.isDestroyed()) win.webContents.setZoomLevel(0);
});

ipcMain.handle('window:copy', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win && !win.isDestroyed()) win.webContents.copy();
});

ipcMain.handle('window:paste', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win && !win.isDestroyed()) win.webContents.paste();
});

ipcMain.handle('window:selectAll', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win && !win.isDestroyed()) win.webContents.selectAll();
});

ipcMain.handle('app:quit', () => {
  app.quit();
});

app.whenReady().then(() => {
  setupShellHandlers();
  setupConfigHandlers();
  setupSessionHandlers();
  setupHistoryHandlers();
  setupPromptToolHandlers();
  setupWorkspaceHandlers();
  setupSessionPersistenceHandlers();

  // Restore persisted workspace visibility
  const persisted = loadSessionState();
  if (persisted.workspaceVisible) {
    setWorkspaceVisible(true);
  }

  Menu.setApplicationMenu(null);

  // Start remote control server if enabled in config
  const config = getConfig();
  setActiveRemoteConfig(config);
  setupRemoteHandlers();
  setupRelayHandlers();
  if (config.remoteControl.enabled) {
    startRemoteServer(config.remoteControl.port, config.remoteControl.token)
      .then(() => {
        startRemoteSync(config.remoteControl.syncInterval);
      })
      .catch((err) => {
        console.error('[CCTerm] Failed to start remote server:', err.message);
      });
  }
  if (config.remoteControl.relayEnabled && config.remoteControl.relayServerUrl) {
    connectRelay(config.remoteControl.relayServerUrl, config.remoteControl.relayToken || '')
      .then(() => { console.log('[CCTerm] Relay connected on startup'); })
      .catch((err) => { console.error('[CCTerm] Relay startup failed:', err.message); });
  }

  setupWindowManager();
  createTerminalWindow();
  setupQuakeMode();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createTerminalWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  stopRemoteSync();
  stopRemoteServer();
  disconnectRelay();
  killAllSessions();
  destroyQuakeMode();
});
