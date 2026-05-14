import React, { useCallback, useRef, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useTabStore } from '../store/tabStore';
import { usePaneStore } from '../store/paneStore';
import '../styles/workspace.css';

const WorkspacePanel: React.FC = () => {
  const { folders, activeFolder, addFolder, removeFolder, setActiveFolder } = useWorkspaceStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; folder: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddFolder = useCallback(async () => {
    const dirs = await window.workspaceAPI.selectFolder();
    if (dirs && dirs.length > 0) addFolder(dirs);
  }, [addFolder]);

  const norm = (p: string) => p.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();

  const handleFolderClick = useCallback((folder: string) => {
    setActiveFolder(folder);
    const nf = norm(folder);
    const tabs = useTabStore.getState().tabs;
    const match = tabs.find(t => t.cwd && norm(t.cwd).startsWith(nf));
    if (match) {
      useTabStore.getState().setActiveTab(match.id);
    }
  }, [setActiveFolder]);

  const handleContextMenu = useCallback((e: React.MouseEvent, folder: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, folder });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleNewTerminal = useCallback(async (folder: string) => {
    const shellType = await window.shellAPI.getDefaultType();
    const title = shellType === 'cmd' ? 'CMD' : 'PowerShell';
    const tab = useTabStore.getState().addTab({ title, shell: shellType, cwd: folder });
    usePaneStore.getState().initRoot(tab.id);
    useTabStore.getState().setActiveTab(tab.id);
    setActiveFolder(folder);
    closeContextMenu();
  }, [setActiveFolder, closeContextMenu]);

  React.useEffect(() => {
    if (!contextMenu) return;
    const handler = () => closeContextMenu();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu, closeContextMenu]);

  const basename = (p: string) => p.split(/[\\/]/).pop() || p;

  return (
    <div className="workspace-panel" onContextMenu={(e) => e.preventDefault()}>
      <div className="workspace-header">
        <span className="workspace-title">Workspace</span>
        <button className="workspace-add-btn" onClick={handleAddFolder} title="Add folder">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="workspace-folders">
        {folders.length === 0 && (
          <div className="workspace-empty">
            Click + to add a folder
          </div>
        )}
        {folders.map((folder) => (
          <div
            key={folder}
            className={`workspace-folder ${folder === activeFolder ? 'active' : ''}`}
            onClick={() => handleFolderClick(folder)}
            onContextMenu={(e) => handleContextMenu(e, folder)}
            title={folder}
          >
            <svg className="workspace-folder-icon" viewBox="0 0 16 16" width="16" height="16">
              <path d="M1 3.5A1.5 1.5 0 012.5 2h3.3l1.5 1.2h5.2A1.5 1.5 0 0114 4.7v7.8a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5V3.5z" fill="#dcb67a" stroke="#dcb67a" strokeWidth="0.5" />
            </svg>
            <span className="workspace-folder-name">{basename(folder)}</span>
          </div>
        ))}
      </div>

      {contextMenu && (
        <div className="workspace-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <div className="context-menu-item" onClick={() => handleNewTerminal(contextMenu.folder)}>
            New Terminal
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item danger" onClick={() => { removeFolder(contextMenu.folder); closeContextMenu(); }}>
            Remove from Workspace
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacePanel;
