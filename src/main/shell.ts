import { ipcMain, BrowserWindow } from 'electron';
import { spawn, IPty } from '@homebridge/node-pty-prebuilt-multiarch';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

function detectDefaultShell(): string {
  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'cmd.exe';
  }
  const shell = process.env.SHELL;
  if (shell && fs.existsSync(shell)) {
    return shell;
  }
  // Fallbacks for Linux/macOS
  const shells = ['/usr/bin/bash', '/bin/bash', '/usr/bin/zsh', '/bin/zsh', '/bin/sh'];
  for (const s of shells) {
    if (fs.existsSync(s)) {
      return s;
    }
  }
  return '/bin/sh';
}

function detectShellArgs(shellPath: string): string[] {
  const name = path.basename(shellPath);
  if (process.platform === 'win32') {
    return [];
  }
  if (name === 'zsh') {
    return [];
  }
  if (name === 'fish') {
    return [];
  }
  return [];
}

function getDefaultCwd(): string {
  return os.homedir();
}

interface TerminalSession {
  pty: IPty;
  pid: number;
}

const sessions = new Map<string, TerminalSession>();

export function setupShellHandlers(): void {
  ipcMain.handle('shell:create', (_event, sessionId: string) => {
    const shellPath = detectDefaultShell();
    const shellArgs = detectShellArgs(shellPath);
    const cwd = getDefaultCwd();

    // Filter env to only string values (avoid node-pty issues on Windows)
    const env: Record<string, string> = { TERM: 'xterm-256color' };
    for (const key of Object.keys(process.env)) {
      const val = process.env[key];
      if (val !== undefined) env[key] = val;
    }

    let pty: IPty;
    try {
      pty = spawn(shellPath, shellArgs, {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd,
        env,
      });
    } catch (err) {
      console.error('[Huffman] Failed to spawn shell:', shellPath, err);
      throw new Error(`Failed to start ${shellPath}: ${(err as Error).message}`);
    }

    pty.onData((data: string) => {
      const channel = `shell:data:${sessionId}`;
      BrowserWindow.getAllWindows().forEach((win) => {
        try {
          if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
            win.webContents.send(channel, data);
          }
        } catch { /* frame disposed */ }
      });
    });

    pty.onExit(({ exitCode }) => {
      const channel = `shell:exit:${sessionId}`;
      BrowserWindow.getAllWindows().forEach((win) => {
        try {
          if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
            win.webContents.send(channel, exitCode);
          }
        } catch { /* frame disposed */ }
      });
      sessions.delete(sessionId);
    });

    sessions.set(sessionId, { pty, pid: pty.pid });
    console.log('[Huffman] Shell started:', shellPath, 'PID:', pty.pid);

    return { pid: pty.pid, shell: shellPath };
  });

  ipcMain.handle('shell:resize', (_event, sessionId: string, cols: number, rows: number) => {
    const session = sessions.get(sessionId);
    if (session) {
      session.pty.resize(cols, rows);
    }
  });

  ipcMain.handle('shell:write', (_event, sessionId: string, data: string) => {
    const session = sessions.get(sessionId);
    if (session) {
      session.pty.write(data);
    }
  });

  ipcMain.handle('shell:kill', (_event, sessionId: string) => {
    const session = sessions.get(sessionId);
    if (session) {
      session.pty.kill();
      sessions.delete(sessionId);
    }
  });
}
