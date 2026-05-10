import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

let windowCounter = 0;
const windows = new Map<number, BrowserWindow>();

export function createTerminalWindow(): BrowserWindow {
  windowCounter++;
  const id = windowCounter;
  const windowId = `window-${id}`;

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    title: 'Huffman Terminal',
    backgroundColor: '#0c0c0c',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const indexPath = path.join(__dirname, '..', 'renderer', 'index.html');
  console.log('[Huffman] Loading renderer from:', indexPath);
  win.loadFile(indexPath).catch((err: Error) => {
    console.error('[Huffman] Failed to load renderer:', err.message);
  });

  win.once('ready-to-show', () => {
    win.show();
    win.webContents.send('terminal-ready', windowId);
  });

  win.on('closed', () => {
    windows.delete(id);
  });

  // Update title based on active tab
  ipcMain.on(`window:setTitle:${windowId}`, (_event, title: string) => {
    if (!win.isDestroyed()) {
      win.setTitle(title ? `${title} - Huffman Terminal` : 'Huffman Terminal');
    }
  });

  windows.set(id, win);
  return win;
}

export function setupWindowManager(): void {
  ipcMain.handle('window:create', () => {
    const win = createTerminalWindow();
    return { id: `window-${windowCounter}` };
  });

  ipcMain.handle('window:getCount', () => {
    return windows.size;
  });
}
