import { ipcMain, BrowserWindow } from 'electron';
import { spawn, IPty } from '@lydell/node-pty';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

function detectDefaultShell(): string {
  if (process.platform === 'win32') {
    // Prefer PowerShell for better ConPTY compatibility
    const pwsh = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    if (fs.existsSync(pwsh)) return pwsh;
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
    const env: Record<string, string> = {};
    if (process.platform !== 'win32') {
      env.TERM = 'xterm-256color';
    }
    for (const key of Object.keys(process.env)) {
      const val = process.env[key];
      if (val !== undefined) env[key] = val;
    }

    const t0 = Date.now();
    console.log('[CCTerm] Spawning shell:', shellPath, 'cwd:', cwd);

    let pty: IPty;
    try {
      pty = spawn(shellPath, shellArgs, {
        name: process.platform === 'win32' ? 'ms-terminal' : 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd,
        env,
      });
    } catch (err) {
      console.error('[CCTerm] Failed to spawn shell:', shellPath, err);
      throw new Error(`Failed to start ${shellPath}: ${(err as Error).message}`);
    }

    pty.onData((data: string) => {
      const elapsed = Date.now() - t0;
      console.log('[CCTerm] Data +%dms: %d bytes', elapsed, data.length);
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
      const elapsed = Date.now() - t0;
      console.log('[CCTerm] Shell exit +%dms: code=%s, signal=%s', elapsed, exitCode, (pty as any)._signal);
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

    pty.on('error', (err: Error) => {
      const elapsed = Date.now() - t0;
      console.error('[CCTerm] PTY error +%dms:', elapsed, err.message, err.stack);
    });

    sessions.set(sessionId, { pty, pid: pty.pid });
    console.log('[CCTerm] Shell started:', shellPath, 'PID:', pty.pid, 'innerPid:', (pty as any)._innerPid);

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
