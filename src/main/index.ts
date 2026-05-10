import { app, BrowserWindow, ipcMain } from 'electron';
import { setupShellHandlers } from './shell';
import { setupConfigHandlers } from './config';
import { setupSessionHandlers } from './session';
import { setupQuakeMode, destroyQuakeMode } from './quake';
import { setupWindowManager, createTerminalWindow } from './windowManager';
import { setupHistoryHandlers } from './history';

ipcMain.handle('shell:openExternal', (_event, url: string) => {
  const { shell } = require('electron');
  shell.openExternal(url);
});

app.whenReady().then(() => {
  setupShellHandlers();
  setupConfigHandlers();
  setupSessionHandlers();
  setupHistoryHandlers();
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
  destroyQuakeMode();
});
