import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../styles/menubar.css';

interface MenuBarProps {
  defaultShellType: string;
  onSetDefaultShellType: (type: string) => void;
  workspaceVisible: boolean;
  onToggleWorkspace: () => void;
  historyVisible: boolean;
  onToggleHistory: () => void;
  onTogglePromptTool: () => void;
  onNewTab: () => void;
  onSplitVertical: () => void;
  onOpenSettings: () => void;
  onToggleSearch: () => void;
  onToggleRemote: () => void;
  remoteRunning: boolean;
  onOpenQrCode: () => void;
}

interface MenuState {
  open: string | null;
  subOpen: string | null;
}

const MenuBar: React.FC<MenuBarProps> = ({
  defaultShellType,
  onSetDefaultShellType,
  workspaceVisible,
  onToggleWorkspace,
  historyVisible,
  onToggleHistory,
  onTogglePromptTool,
  onNewTab,
  onSplitVertical,
  onOpenSettings,
  onToggleSearch,
  onToggleRemote,
  remoteRunning,
  onOpenQrCode,
}) => {
  const [menu, setMenu] = useState<MenuState>({ open: null, subOpen: null });
  const barRef = useRef<HTMLDivElement>(null);

  const closeMenus = useCallback(() => {
    setMenu({ open: null, subOpen: null });
  }, []);

  const toggleMenu = useCallback((name: string) => {
    setMenu((prev) => ({
      open: prev.open === name ? null : name,
      subOpen: null,
    }));
  }, []);

  const openSub = useCallback((name: string) => {
    setMenu((prev) => ({ ...prev, subOpen: name }));
  }, []);

  // Close menus on click outside
  useEffect(() => {
    if (!menu.open && !menu.subOpen) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        closeMenus();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menu.open, menu.subOpen, closeMenus]);

  // Close menus on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenus();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeMenus]);

  const btnClass = (name: string) =>
    `menubar-item${menu.open === name ? ' open' : ''}`;

  // Prevent menu buttons from stealing focus from terminal
  const noFocus = (e: React.MouseEvent) => { e.preventDefault(); };

  return (
    <div className="menubar" ref={barRef}>
      <div className="menubar-left">
        {/* File menu */}
        <div className="menubar-dropdown">
          <button className={btnClass('file')} onMouseDown={noFocus} onClick={() => toggleMenu('file')}>
            File
          </button>
          {menu.open === 'file' && (
            <div className="menubar-menu" onMouseDown={noFocus}>
              <div
                className="menubar-menu-item has-sub"
                onMouseEnter={() => openSub('defaultShell')}
                onClick={() => openSub('defaultShell')}
              >
                <span>Default Shell</span>
                <span className="menubar-menu-arrow">▶</span>
                {(menu.subOpen === 'defaultShell') && (
                  <div className="menubar-submenu">
                    <div
                      className={`menubar-menu-item${defaultShellType === 'powershell' ? ' checked' : ''}`}
                      onClick={(e) => { e.stopPropagation(); onSetDefaultShellType('powershell'); closeMenus(); }}
                    >
                      {defaultShellType === 'powershell' ? '● ' : '○ '}PowerShell
                    </div>
                    <div
                      className={`menubar-menu-item${defaultShellType === 'cmd' ? ' checked' : ''}`}
                      onClick={(e) => { e.stopPropagation(); onSetDefaultShellType('cmd'); closeMenus(); }}
                    >
                      {defaultShellType === 'cmd' ? '● ' : '○ '}CMD
                    </div>
                  </div>
                )}
              </div>
              <div className="menubar-separator" />
              <div className="menubar-menu-item" onClick={() => { window.windowAPI.quit(); closeMenus(); }}>
                Quit
              </div>
            </div>
          )}
        </div>

        {/* Edit menu */}
        <div className="menubar-dropdown">
          <button className={btnClass('edit')} onMouseDown={noFocus} onClick={() => toggleMenu('edit')}>
            Edit
          </button>
          {menu.open === 'edit' && (
            <div className="menubar-menu" onMouseDown={noFocus}>
              <div className="menubar-menu-item" onClick={() => { window.windowAPI.copy(); closeMenus(); }}>
                Copy
                <span className="menubar-shortcut">Ctrl+C</span>
              </div>
              <div className="menubar-menu-item" onClick={() => { window.windowAPI.paste(); closeMenus(); }}>
                Paste
                <span className="menubar-shortcut">Ctrl+V</span>
              </div>
              <div className="menubar-menu-item" onClick={() => { window.windowAPI.selectAll(); closeMenus(); }}>
                Select All
                <span className="menubar-shortcut">Ctrl+A</span>
              </div>
            </div>
          )}
        </div>

        {/* Tool menu */}
        <div className="menubar-dropdown">
          <button className={btnClass('tool')} onMouseDown={noFocus} onClick={() => toggleMenu('tool')}>
            Tool
          </button>
          {menu.open === 'tool' && (
            <div className="menubar-menu" onMouseDown={noFocus}>
              <div className="menubar-menu-item" onClick={() => { onTogglePromptTool(); closeMenus(); }}>
                Prompt Tool
                <span className="menubar-shortcut">Ctrl+Alt+P</span>
              </div>
            </div>
          )}
        </div>

        {/* View menu */}
        <div className="menubar-dropdown">
          <button className={btnClass('view')} onMouseDown={noFocus} onClick={() => toggleMenu('view')}>
            View
          </button>
          {menu.open === 'view' && (
            <div className="menubar-menu" onMouseDown={noFocus}>
              <div className="menubar-menu-item" onClick={() => { window.windowAPI.reload(); closeMenus(); }}>
                Reload
                <span className="menubar-shortcut">Ctrl+R</span>
              </div>
              <div className="menubar-menu-item" onClick={() => { window.windowAPI.toggleDevTools(); closeMenus(); }}>
                Toggle DevTools
                <span className="menubar-shortcut">Ctrl+Shift+I</span>
              </div>
              <div className="menubar-separator" />
              <div className="menubar-menu-item" onClick={() => { window.windowAPI.zoomIn(); closeMenus(); }}>
                Zoom In
                <span className="menubar-shortcut">Ctrl+=</span>
              </div>
              <div className="menubar-menu-item" onClick={() => { window.windowAPI.zoomOut(); closeMenus(); }}>
                Zoom Out
                <span className="menubar-shortcut">Ctrl+-</span>
              </div>
              <div className="menubar-menu-item" onClick={() => { window.windowAPI.zoomReset(); closeMenus(); }}>
                Reset Zoom
                <span className="menubar-shortcut">Ctrl+0</span>
              </div>
              <div className="menubar-separator" />
              <div
                className={`menubar-menu-item${workspaceVisible ? ' checked' : ''}`}
                onClick={() => { onToggleWorkspace(); closeMenus(); }}
              >
                {workspaceVisible ? '✓ ' : ''}Folder as Workspace
              </div>
              <div
                className={`menubar-menu-item${historyVisible ? ' checked' : ''}`}
                onClick={() => { onToggleHistory(); closeMenus(); }}
              >
                {historyVisible ? '✓ ' : ''}Show History
                <span className="menubar-shortcut">Ctrl+Shift+H</span>
              </div>
              <div className="menubar-separator" />
              <div
                className={`menubar-menu-item${remoteRunning ? ' checked' : ''}`}
                onClick={() => { onToggleRemote(); closeMenus(); }}
              >
                {remoteRunning ? '✓ ' : ''}Remote Control
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="menubar-right">
        <button className="menubar-toolbar-btn" onClick={onNewTab} title="New Tab (Ctrl+Shift+T)">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.2" />
            <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <button className="menubar-toolbar-btn" onClick={onSplitVertical} title="Split Vertically (Alt+Shift+-)">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect x="2" y="2" width="4" height="10" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="8" y="2" width="4" height="10" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <div className="menubar-toolbar-sep" />
        <button
          className={`menubar-toolbar-btn${workspaceVisible ? ' active' : ''}`}
          onClick={onToggleWorkspace}
          title="Toggle Workspace"
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M1 2.5A1.5 1.5 0 012.5 1h3l1.4 1h5.6A1.5 1.5 0 0114 3.5v8a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 11.5v-9z" fill="none" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        </button>
        <button
          className={`menubar-toolbar-btn${historyVisible ? ' active' : ''}`}
          onClick={onToggleHistory}
          title="Toggle History (Ctrl+Shift+H)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <polyline points="7,3 7,7 10,9" fill="none" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        </button>
        <button
          className="menubar-toolbar-btn"
          onClick={onTogglePromptTool}
          title="Prompt Tool (Ctrl+Alt+P)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect x="2" y="2.5" width="10" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <line x1="5" y1="5.5" x2="5" y2="8.5" stroke="currentColor" strokeWidth="1" />
            <line x1="7" y1="4" x2="7" y2="10" stroke="currentColor" strokeWidth="1" />
            <line x1="9" y1="5.5" x2="9" y2="8.5" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button
          className={`menubar-toolbar-btn shell-btn${defaultShellType === 'powershell' ? ' ps' : ' cmd'}`}
          onClick={() => onSetDefaultShellType(defaultShellType === 'powershell' ? 'cmd' : 'powershell')}
          title={`Current: ${defaultShellType === 'powershell' ? 'PowerShell' : 'CMD'} — Click to switch to ${defaultShellType === 'powershell' ? 'CMD' : 'PowerShell'}`}
        >
          {defaultShellType === 'powershell' ? 'PS' : 'CMD'}
        </button>
        <div className="menubar-toolbar-sep" />
        <button className="menubar-toolbar-btn" onClick={onOpenQrCode} title="远程操控二维码">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect x="2" y="2" width="10" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <rect x="4" y="4" width="2.5" height="2.5" fill="currentColor" />
            <rect x="7.5" y="4" width="2.5" height="2.5" fill="currentColor" />
            <rect x="4" y="7.5" width="2.5" height="2.5" fill="currentColor" />
            <rect x="7.5" y="7.5" width="2.5" height="2.5" fill="currentColor" />
          </svg>
        </button>
        <button className="menubar-toolbar-btn" onClick={onToggleSearch} title="Search (Ctrl+Shift+F)">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="6" cy="6" r="4.7" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <line x1="9.3" y1="9.3" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
        <button className="menubar-toolbar-btn" onClick={onOpenSettings} title="Settings (Ctrl+,)">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <path d="M7 1.5 L7.6 3.3 L7.6 3.4 L7 4.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <path d="M7 12.5 L7.6 10.7 L7.6 10.6 L7 9.8" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <path d="M1.5 7 L3.3 6.4 L3.4 6.4 L4.2 7" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <path d="M12.5 7 L10.7 6.4 L10.6 6.4 L9.8 7" fill="none" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MenuBar;
