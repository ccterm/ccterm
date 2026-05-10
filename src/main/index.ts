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
  killAllSessions();
  destroyQuakeMode();
});
