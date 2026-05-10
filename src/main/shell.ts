import { ipcMain, BrowserWindow } from 'electron';
import { spawn, IPty } from '@lydell/node-pty';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

let defaultShellType = 'powershell';

export function getDefaultShellType(): string {
  return defaultShellType;
}

export function setDefaultShellType(type: string): void {
  defaultShellType = type;
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
      win.webContents.send('shell:defaultTypeChanged', type);
    }
  });
}

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

export function getSessionCwd(sessionId: string): string {
  const session = sessions.get(sessionId);
  return session?.cwd || '';
}

export function resolveShellPath(shellType?: string): string {
  if (!shellType || shellType === 'default') {
    return detectDefaultShell();
  }
  if (shellType === 'powershell') {
    const pwsh = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    if (fs.existsSync(pwsh)) return pwsh;
    return 'powershell.exe';
  }
  if (shellType === 'cmd') {
    return process.env.COMSPEC || 'cmd.exe';
  }
  // Treat as a path
  if (fs.existsSync(shellType)) return shellType;
  return detectDefaultShell();
}

function detectShellArgs(shellPath: string): string[] {
  const name = path.basename(shellPath).toLowerCase();
  if (process.platform === 'win32') {
    if (name.includes('powershell')) {
      // Prompt setup is handled separately via a temp -File script,
      // so detectShellArgs can't provide the full args yet — return empty.
      return [];
    }
    if (name.includes('cmd')) {
      // /k runs the command then stays interactive (not echoed)
      return ['/k', 'prompt $E]7;file://%COMPUTERNAME%/$P$E\\$_$P$G'];
    }
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
  if (process.platform === 'win32') {
    return 'D:\\';
  }
  return os.homedir();
}

interface TerminalSession {
  pty: IPty;
  pid: number;
  cwd: string;
}

const sessions = new Map<string, TerminalSession>();

export function killAllSessions(): void {
  for (const [id, session] of sessions) {
    try { session.pty.kill(); } catch { /* ignore */ }
    sessions.delete(id);
  }
}

export function setupShellHandlers(): void {
  ipcMain.handle('shell:create', (_event, sessionId: string, shellType?: string, cwdOverride?: string) => {
    const shellPath = resolveShellPath(shellType);
    const shellArgs = detectShellArgs(shellPath);
    let cwd = cwdOverride && fs.existsSync(cwdOverride) ? cwdOverride : getDefaultCwd();

    // For Windows PowerShell, write prompt function to a temp .ps1 file and use
    // -File instead of -Command. This way the welcome banner shows and the
    // function definition is never echoed to the terminal.
    let promptScriptPath: string | null = null;
    let finalShellArgs = shellArgs;
    if (process.platform === 'win32' && shellPath.toLowerCase().includes('powershell')) {
      promptScriptPath = path.join(os.tmpdir(), `ccterm-prompt-${sessionId}.ps1`);
      fs.writeFileSync(promptScriptPath,
        "function prompt { $cwd = (Get-Location).Path; $osc7 = [char]27 + ']7;file://' + $env:COMPUTERNAME + '/' + ($cwd -replace '\\\\', '/') + [char]27 + '\\'; return $osc7 + 'PS ' + $cwd + '> ' }\r\n",
        'utf-8');
      finalShellArgs = ['-NoExit', '-ExecutionPolicy', 'Bypass', '-File', promptScriptPath];
    }

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
      pty = spawn(shellPath, finalShellArgs, {
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

    const sessionCwd = { current: cwd };

    // Inject OSC 7 CWD reporting into the shell prompt.
    // Windows shells get prompt setup via spawn args (-Command or /k), not via pty.write.
    try {
      if (process.platform !== 'win32') {
        const shellName = path.basename(shellPath);
        if (shellName === 'bash' || shellName === 'zsh') {
          pty.write('export PROMPT_COMMAND=\'printf "\\033]7;file://$(hostname)/$(pwd)\\033\\\\"\'\r');
        }
      }
    } catch { /* best effort */ }

    pty.onData((data: string) => {
      const channel = `shell:data:${sessionId}`;
      // Parse OSC 7 for CWD tracking: ESC ] 7 ; file://HOST/ PATH BEL or ESC \
      const osc7Regex = /\x1b\]7;file:\/\/[^\/]*\/([^\x07\x1b]*)(?:\x07|\x1b\\)/g;
      let match;
      let lastCwd = '';
      while ((match = osc7Regex.exec(data)) !== null) {
        try {
          lastCwd = decodeURI(match[1].replace(/\\/g, '/'));
        } catch { /* ignore */ }
      }
      if (lastCwd && lastCwd !== sessionCwd.current) {
        sessionCwd.current = lastCwd;
        const session = sessions.get(sessionId);
        if (session) session.cwd = lastCwd;
        BrowserWindow.getAllWindows().forEach((win) => {
          try {
            if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
              win.webContents.send(`shell:cwd:${sessionId}`, lastCwd);
            }
          } catch { /* frame disposed */ }
        });
      }
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
      console.log('[CCTerm] Shell exit +%dms: code=%s', elapsed, exitCode);
      // Clean up temp prompt script
      if (promptScriptPath) {
        try { fs.unlinkSync(promptScriptPath); } catch { /* ignore */ }
      }
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

    sessions.set(sessionId, { pty, pid: pty.pid, cwd });
    console.log('[CCTerm] Shell started:', shellPath, 'PID:', pty.pid);

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

  ipcMain.handle('shell:getDefaultType', () => {
    return getDefaultShellType();
  });

  ipcMain.handle('shell:setDefaultType', (_event, type: string) => {
    setDefaultShellType(type);
  });

  ipcMain.handle('shell:getCwd', (_event, sessionId: string) => {
    const session = sessions.get(sessionId);
    return session?.cwd || '';
  });
}
