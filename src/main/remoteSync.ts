import { BrowserWindow, ipcMain } from 'electron';
import { saveSnapshot, getCommands, clearCommands, getPendingActiveSessionId, clearPendingActiveSessionId, getPendingCreateTab, clearPendingCreateTab } from './remoteServer';
import { getSessionMap } from './shell';

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
    console.log('[CCTerm] Pushing active session to desktop:', pendingId);
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
        win.webContents.send('remote:activateTab', pendingId);
      }
    });
  }

  // Push pending tab creation from phone to desktop
  const pendingShell = getPendingCreateTab();
  if (pendingShell) {
    clearPendingCreateTab();
    console.log('[CCTerm] Pushing create tab to desktop, shell:', pendingShell);
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
        win.webContents.send('remote:createTab', pendingShell);
      }
    });
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
