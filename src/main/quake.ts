import { app, BrowserWindow, globalShortcut, screen } from 'electron';
import * as path from 'path';

let quakeWindow: BrowserWindow | null = null;
let isQuakeVisible = false;

function getQuakeBounds(): Electron.Rectangle {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;
  const height = Math.round(primaryDisplay.workAreaSize.height * 0.55);
  return { x: 0, y: 0, width, height };
}

function createQuakeWindow(): void {
  const bounds = getQuakeBounds();

  quakeWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: -bounds.height, // Start off-screen above for slide-in animation
    frame: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    resizable: true,
    show: false,
    backgroundColor: '#0c0c0c',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  quakeWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  quakeWindow.on('blur', () => {
    // Auto-hide when focus is lost
    hideQuake();
  });

  quakeWindow.on('closed', () => {
    quakeWindow = null;
    isQuakeVisible = false;
  });
}

function showQuake(): void {
  if (!quakeWindow) {
    createQuakeWindow();
  }

  if (!quakeWindow) return;

  const bounds = getQuakeBounds();

  // Update position and size for current display
  quakeWindow.setBounds(bounds);
  quakeWindow.show();
  quakeWindow.setPosition(bounds.x, 0);
  quakeWindow.focus();
  quakeWindow.webContents.send('terminal-ready');
  isQuakeVisible = true;
}

function hideQuake(): void {
  if (!quakeWindow || !isQuakeVisible) return;

  const bounds = quakeWindow.getBounds();
  quakeWindow.hide();
  isQuakeVisible = false;
}

function toggleQuake(): void {
  if (isQuakeVisible) {
    hideQuake();
  } else {
    showQuake();
  }
}

export function setupQuakeMode(): void {
  // Register global shortcut for Win+`
  const registered = globalShortcut.register('Super+`', () => {
    toggleQuake();
  });

  if (!registered) {
    console.warn('Failed to register Quake Mode global shortcut (Super+`)');
    // Try alternative
    try {
      globalShortcut.register('Alt+`', toggleQuake);
    } catch {
      // ignore
    }
  }

  // Update bounds on display change
  screen.on('display-metrics-changed', () => {
    if (quakeWindow && isQuakeVisible) {
      const bounds = getQuakeBounds();
      quakeWindow.setBounds(bounds);
      quakeWindow.setPosition(bounds.x, 0);
    }
  });
}

export function destroyQuakeMode(): void {
  globalShortcut.unregisterAll();
  if (quakeWindow) {
    quakeWindow.close();
    quakeWindow = null;
  }
}
