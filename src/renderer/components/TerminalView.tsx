import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { SearchAddon } from '@xterm/addon-search';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useTabStore } from '../store/tabStore';
import { useSearchStore } from '../store/searchStore';
import { useProfile, useScheme } from '../hooks/useProfile';
import { useCommandCapture } from '../hooks/useCommandCapture';
import '@xterm/xterm/css/xterm.css';
import '../styles/terminal.css';

interface TerminalViewProps {
  tabId: string;
  sessionId: string;
  onReady?: () => void;
}

const TerminalView: React.FC<TerminalViewProps> = ({ tabId, sessionId, onReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<Terminal | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuState, setMenuState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    hasSelection: boolean;
  }>({ visible: false, x: 0, y: 0, hasSelection: false });
  const updateTabTitle = useTabStore((s) => s.updateTabTitle);
  const updateTabCwd = useTabStore((s) => s.updateTabCwd);
  const getTabShell = useTabStore((s) => s.tabs.find(t => t.id === tabId)?.shell);
  const getTabCwd = useTabStore((s) => s.tabs.find(t => t.id === tabId)?.cwd);
  const registerAddon = useSearchStore((s) => s.registerAddon);
  const unregisterAddon = useSearchStore((s) => s.unregisterAddon);
  const profile = useProfile();
  const scheme = useScheme(profile.colorScheme);

  const { handleInput: captureInput } = useCommandCapture(sessionId);

  // Apply visual effects
  useEffect(() => {
    if (!termRef.current) return;
    const el = termRef.current;
    el.style.opacity = String(profile.opacity);
    if (profile.backgroundImage) {
      el.style.backgroundImage = `url(${profile.backgroundImage})`;
      el.style.backgroundSize = profile.backgroundImageStretchMode;
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';
    } else {
      el.style.backgroundImage = 'none';
    }
  }, [profile.opacity, profile.backgroundImage, profile.backgroundImageStretchMode]);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      allowProposedApi: true,
      cursorStyle: profile.cursorShape,
      cursorWidth: profile.cursorShape === 'bar' ? 2 : undefined,
      fontSize: profile.fontSize,
      fontFamily: `'${profile.fontFace}', 'Cascadia Code', 'Fira Code', 'Consolas', monospace`,
      allowTransparency: profile.opacity < 1,
      scrollback: profile.scrollbackLines,
      theme: {
        background: scheme.background,
        foreground: scheme.foreground,
        cursor: profile.cursorColor || scheme.cursor,
        selectionBackground: scheme.selectionBackground,
        black: scheme.black, red: scheme.red,
        green: scheme.green, yellow: scheme.yellow,
        blue: scheme.blue, magenta: scheme.magenta,
        cyan: scheme.cyan, white: scheme.white,
        brightBlack: scheme.brightBlack,
        brightRed: scheme.brightRed,
        brightGreen: scheme.brightGreen,
        brightYellow: scheme.brightYellow,
        brightBlue: scheme.brightBlue,
        brightMagenta: scheme.brightMagenta,
        brightCyan: scheme.brightCyan,
        brightWhite: scheme.brightWhite,
      },
    });

    // Unicode 11 support (emoji + CJK)
    term.loadAddon(new Unicode11Addon());
    term.unicode.activeVersion = '11';

    // Fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Search addon
    const searchAddon = new SearchAddon();
    term.loadAddon(searchAddon);
    registerAddon(sessionId, searchAddon);

    // Web links addon (clickable URLs)
    term.loadAddon(new WebLinksAddon((event, uri) => {
      window.appAPI.openExternal(uri);
    }));

    // WebGL addon for GPU acceleration
    try {
      const webglAddon = new WebglAddon();
      term.loadAddon(webglAddon);
    } catch {
      // WebGL not available
    }

    term.open(containerRef.current);
    termInstanceRef.current = term;
    fitAddon.fit();

    // Create shell session (pass shell type from tab info, e.g. 'powershell' or 'cmd')
    const shellType = getTabShell || undefined;
    const cwd = getTabCwd || undefined;
    window.shellAPI.create(sessionId, shellType, cwd).then(({ pid, shell }) => {
      updateTabTitle(tabId, basename(shell));
      pushSnapshot();
      term.writeln(`\x1b[32mCCTerm Super Terminal\x1b[0m - PID: ${pid}`);
      term.writeln('');
      onReady?.();
    }).catch((err: Error) => {
      term.writeln(`\r\n\x1b[31mFailed to start shell:\x1b[0m ${err.message}`);
      term.writeln('Check your shell configuration in Settings.');
    });

    // Shell data -> terminal
    const unsubData = window.shellAPI.onData(sessionId, (data) => {
      term.write(data);
    });

    // Terminal input -> shell
    const unsubKey = term.onData((data) => {
      captureInput(data);
      window.shellAPI.write(sessionId, data);
    });

    // Handle resize — both window resize and layout changes (history panel, etc.)
    const onResize = () => {
      try {
        fitAddon.fit();
        const dims = fitAddon.proposeDimensions();
        if (dims) {
          window.shellAPI.resize(sessionId, dims.cols, dims.rows);
        }
      } catch { /* ignore */ }
    };
    window.addEventListener('resize', onResize);
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(containerRef.current);

    // Shell exit handling
    const unsubExit = window.shellAPI.onExit(sessionId, (code) => {
      term.writeln(`\r\n\x1b[33m[Process completed (exit code: ${code})]\x1b[0m`);
    });

    // File drag & drop
    const dragHandler = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files.length) {
        const paths = Array.from(e.dataTransfer.files)
          .map((f) => {
            const p = f.path || f.name;
            return p.includes(' ') ? `"${p}"` : p;
          })
          .join(' ');
        term.write(paths + ' ');
      }
    };
    containerRef.current.addEventListener('drop', dragHandler);

    // Prevent default drag behavior
    const preventDrag = (e: DragEvent) => e.preventDefault();
    containerRef.current.addEventListener('dragover', preventDrag);

    // Right-click context menu
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const selection = term.getSelection();
      setMenuState({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        hasSelection: selection.length > 0,
      });
    };
    containerRef.current.addEventListener('contextmenu', onContextMenu);

    return () => {
      unsubData();
      unsubKey.dispose();
      unsubExit();
      window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();
      unregisterAddon(sessionId);
      if (containerRef.current) {
        containerRef.current.removeEventListener('drop', dragHandler);
        containerRef.current.removeEventListener('dragover', preventDrag);
        containerRef.current.removeEventListener('contextmenu', onContextMenu);
      }
      window.shellAPI.kill(sessionId);
      termInstanceRef.current = null;
      term.dispose();
    };
  }, [sessionId, tabId, updateTabTitle, onReady, registerAddon, unregisterAddon,
      profile.fontSize, profile.fontFace, profile.cursorShape, profile.cursorColor,
      profile.scrollbackLines, profile.opacity, scheme]);

  // Track CWD changes and update the tab store (for workspace folder matching)
  useEffect(() => {
    window.shellAPI.getCwd(sessionId).then((cwd) => {
      if (cwd) updateTabCwd(tabId, cwd);
    });
    const unsub = window.shellAPI.onCwdChanged(sessionId, (cwd) => {
      updateTabCwd(tabId, cwd);
    });
    return unsub;
  }, [sessionId, tabId, updateTabCwd]);

  // Periodic snapshot push for remote control
  const lastSnapshotRef = useRef<string>('');
  const pushSnapshot = useCallback(() => {
    const term = termInstanceRef.current;
    if (!term) return;
    const buffer = term.buffer.active;
    const lines: Array<{ text: string; fg: number; bg: number }> = [];
    for (let row = 0; row < buffer.length; row++) {
      const line = buffer.getLine(row);
      if (line) {
        lines.push({ text: line.translateToString(true), fg: 7, bg: 0 });
      } else {
        lines.push({ text: '', fg: 7, bg: 0 });
      }
    }
    const tabs = useTabStore.getState().tabs;
    const tab = tabs.find(t => t.id === tabId);
    const snapshot = {
      sessionId,
      tabTitle: tab?.title || '',
      cwd: tab?.cwd || getTabCwd || '',
      cols: term.cols,
      termRows: term.rows,
      cursorRow: buffer.baseY + buffer.cursorY,
      cursorCol: buffer.cursorX,
      lines,
      timestamp: Date.now(),
    };
    // Skip if nothing changed since last push
    const { timestamp: _, ...snapshotWithoutTs } = snapshot;
    const fingerprint = JSON.stringify(snapshotWithoutTs);
    if (fingerprint === lastSnapshotRef.current) return;
    lastSnapshotRef.current = fingerprint;
    window.remoteAPI.pushSnapshot(sessionId, snapshot);
    // Keep active session in sync so phone shows the correct tab
    const activeTabId = useTabStore.getState().activeTabId;
    if (tabId === activeTabId) {
      window.remoteAPI.setActiveSession(sessionId);
      // Only push the active tab's snapshot via relay — phone only displays active session
      window.relayAPI.pushSnapshot(sessionId, snapshot).catch(() => {});
    }
  }, [sessionId, tabId, getTabCwd]);

  useEffect(() => {
    pushSnapshot();
    const interval = setInterval(pushSnapshot, 2000);
    return () => clearInterval(interval);
  }, [pushSnapshot]);

  // Close context menu on click outside
  useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuState((s) => ({ ...s, visible: false }));
      }
    };
    if (menuState.visible) {
      window.addEventListener('click', closeMenu);
    }
    return () => window.removeEventListener('click', closeMenu);
  }, [menuState.visible]);

  const handleCopy = useCallback(async () => {
    const term = termInstanceRef.current;
    if (!term) return;
    const selection = term.getSelection();
    if (selection) {
      await window.clipboardAPI.write(selection);
    }
    setMenuState((s) => ({ ...s, visible: false }));
    term.focus();
  }, []);

  const handlePaste = useCallback(async () => {
    const term = termInstanceRef.current;
    if (!term) return;
    try {
      const text = await window.clipboardAPI.read();
      if (text) {
        window.shellAPI.write(sessionId, text);
      }
    } catch {
      // clipboard read failed (e.g. no text content)
    }
    setMenuState((s) => ({ ...s, visible: false }));
    term.focus();
  }, [sessionId]);

  return (
    <div
      ref={termRef}
      className="terminal-view"
      style={{ background: scheme.background }}
    >
      <div className="terminal-container" ref={containerRef} />
      {menuState.visible && (
        <div
          ref={menuRef}
          className="terminal-context-menu"
          style={{ left: menuState.x, top: menuState.y }}
        >
          <div
            className={`context-menu-item${menuState.hasSelection ? '' : ' disabled'}`}
            onClick={menuState.hasSelection ? handleCopy : undefined}
          >
            <span>Copy</span>
            <span className="context-menu-shortcut">Ctrl+Shift+C</span>
          </div>
          <div
            className="context-menu-item"
            onClick={handlePaste}
          >
            <span>Paste</span>
            <span className="context-menu-shortcut">Ctrl+Shift+V</span>
          </div>
        </div>
      )}
    </div>
  );
};

function basename(p: string): string {
  return p.split(/[\\/]/).pop() || p;
}

export default TerminalView;
