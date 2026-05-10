import { BrowserWindow, ipcMain } from 'electron';
import { saveSnapshot, getCommands, clearCommands, getPendingActiveSessionId, clearPendingActiveSessionId, getPendingCreateTab, clearPendingCreateTab, getPendingCreateTabCwd, getPendingActivateWorkspaceIndex, clearPendingActivateWorkspaceIndex } from './remoteServer';
import { getSessionMap } from './shell';
import { getWorkspaceFolders } from './workspace';

let pollTimer: ReturnType<typeof setInterval> | null = null;
let syncInterval = 2000;

// Snapshot received from renderer — store in server session store
ipcMain.handle('remote:pushSnapshot', (_event, sessionId: string, snapshot: any) => {
  saveSnapshot(sessionId, snapshot);
});

// Poll for pending commands from phone and write to PTY
async function processCommands(): Promise<void> {
  const sessions = getSessionMap();
  for (const [sessionId, session] of sessions) {
    const commands = getCommands(sessionId);
    if (commands.length === 0) continue;

    for (const cmd of commands) {
      const text = cmd.sendEnter ? cmd.text + '\r' : cmd.text;
      try { session.pty.write(text); } catch { /* ignore */ }
    }
    clearCommands(sessionId);
  }

  // Push pending active session change from phone to desktop
  const pendingId = getPendingActiveSessionId();
  if (pendingId) {
    clearPendingActiveSessionId();
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
        win.webContents.send('remote:activateTab', pendingId);
      }
    });
  }

  // Push pending tab creation from phone to desktop
  const pendingShell = getPendingCreateTab();
  if (pendingShell) {
    const pendingCwd = getPendingCreateTabCwd();
    clearPendingCreateTab();
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
        win.webContents.send('remote:createTab', { shell: pendingShell, cwd: pendingCwd || undefined });
      }
    });
  }

  // Push pending workspace folder activation from phone to desktop
  const wsIndex = getPendingActivateWorkspaceIndex();
  if (wsIndex >= 0) {
    clearPendingActivateWorkspaceIndex();
    const folders = getWorkspaceFolders();
    const folder = folders[wsIndex];
    if (folder) {
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
          win.webContents.send('remote:activateWorkspace', folder);
        }
      });
    }
  }
}

export function startRemoteSync(interval: number): void {
  syncInterval = interval;
  stopRemoteSync();
  pollTimer = setInterval(processCommands, syncInterval);
  console.log('[CCTerm] Remote sync started, interval:', syncInterval, 'ms');
}

export function stopRemoteSync(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    console.log('[CCTerm] Remote sync stopped');
  }
}
