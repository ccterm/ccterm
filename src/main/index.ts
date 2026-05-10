import { app, BrowserWindow, clipboard, ipcMain, Menu } from 'electron';
import { setupShellHandlers, killAllSessions, getDefaultShellType, setDefaultShellType } from './shell';
import { setupConfigHandlers } from './config';
import { setupSessionHandlers } from './session';
import { setupQuakeMode, destroyQuakeMode } from './quake';
import { setupWindowManager, createTerminalWindow } from './windowManager';
import { setupHistoryHandlers } from './history';
import { setupPromptToolHandlers } from './promptTool';
import { setupWorkspaceHandlers, getWorkspaceFolders, isWorkspaceVisible, setWorkspaceVisible } from './workspace';
import { setupSessionPersistenceHandlers, loadSessionState, getHistoryVisible } from './sessionPersistence';

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

  setupWindowManager();
  createTerminalWindow();
  setupQuakeMode();

  // Application menu
  function buildMenu(): Menu {
    const currentDefault = getDefaultShellType();
    return Menu.buildFromTemplate([
      {
        label: 'File',
        submenu: [
          {
            label: 'Default Shell',
            submenu: [
              {
                label: 'PowerShell',
                type: 'radio',
                checked: currentDefault === 'powershell',
                click: () => {
                  setDefaultShellType('powershell');
                  Menu.setApplicationMenu(buildMenu());
                },
              },
              {
                label: 'CMD',
                type: 'radio',
                checked: currentDefault === 'cmd',
                click: () => {
                  setDefaultShellType('cmd');
                  Menu.setApplicationMenu(buildMenu());
                },
              },
            ],
          },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'Tool',
        submenu: [
          {
            label: 'Prompt Tool',
            accelerator: 'CmdOrCtrl+Alt+P',
            click: () => {
              const win = BrowserWindow.getFocusedWindow();
              if (win && !win.isDestroyed()) {
                win.webContents.send('menu:toggle-prompt-tool');
              }
            },
          },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { role: 'resetZoom' },
          { type: 'separator' },
          {
            label: 'Folder as Workspace',
            type: 'checkbox',
            checked: isWorkspaceVisible(),
            click: (menuItem) => {
              const checked = menuItem.checked;
              setWorkspaceVisible(checked);
              Menu.setApplicationMenu(buildMenu());
              BrowserWindow.getAllWindows().forEach((win) => {
                if (!win.isDestroyed()) {
                  win.webContents.send('menu:toggle-workspace', checked);
                }
              });
            },
          },
          {
            label: 'Show History',
            accelerator: 'CmdOrCtrl+Shift+H',
            type: 'checkbox',
            checked: getHistoryVisible(),
            click: (menuItem) => {
              const checked = menuItem.checked;
              BrowserWindow.getAllWindows().forEach((win) => {
                if (!win.isDestroyed()) {
                  win.webContents.send('menu:toggle-history', checked);
                }
              });
              Menu.setApplicationMenu(buildMenu());
            },
          },
        ],
      },
    ]);
  }
  Menu.setApplicationMenu(buildMenu());

  // Sync history visibility from renderer (e.g. HistoryPanel close button)
  ipcMain.handle('menu:syncHistoryVisible', (_event, visible: boolean) => {
    // State is already saved via persistence, just rebuild the menu
    Menu.setApplicationMenu(buildMenu());
  });

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
