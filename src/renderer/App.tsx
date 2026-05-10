import React, { useCallback, useEffect, useRef, useState } from 'react';
import TabBar from './components/TabBar';
import PaneLayout from './components/PaneLayout';
import SettingsPage from './components/SettingsPage';
import CommandPalette from './components/CommandPalette';
import SearchOverlay from './components/SearchOverlay';
import HistoryPanel from './components/HistoryPanel';
import PromptTool from './components/PromptTool';
import WorkspacePanel from './components/WorkspacePanel';
import { useTabStore } from './store/tabStore';
import { usePaneStore } from './store/paneStore';
import { useCommandStore } from './store/commandStore';
import { useSearchStore } from './store/searchStore';
import { useConfigStore } from './store/configStore';
import { useWorkspaceStore } from './store/workspaceStore';
import './styles/global.css';

const App: React.FC = () => {
  const { tabs, activeTabId, addTab } = useTabStore();
  const { split, initRoot } = usePaneStore();
  const { registerCommands } = useCommandStore();
  const { load: loadConfig, loaded: configLoaded } = useConfigStore();
  const { visible: wsVisible, setVisible: setWsVisible, folders: wsFolders, activeFolder, setFolders } = useWorkspaceStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPromptTool, setShowPromptTool] = useState(false);
  const [defaultShellType, setDefaultShellType] = useState<string>('powershell');
  const initialTabCreated = useRef(false);
  const sessionLoaded = useRef(false);

  // Load config on startup
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Listen for View > Show History menu toggle
  useEffect(() => {
    const unsub = window.menuAPI.onToggleHistory((visible) => {
      setShowHistory(visible);
    });
    return unsub;
  }, []);

  // Listen for Tool > Prompt Tool menu toggle
  useEffect(() => {
    const unsub = window.menuAPI.onTogglePromptTool(() => {
      setShowPromptTool((v) => !v);
    });
    return unsub;
  }, []);

  // Listen for View > Folder as Workspace toggle
  useEffect(() => {
    const unsub = window.menuAPI.onToggleWorkspace((visible) => {
      setWsVisible(visible);
    });
    return unsub;
  }, [setWsVisible]);

  // Load workspace folders on mount
  useEffect(() => {
    window.workspaceAPI.getAll().then(setFolders);
  }, [setFolders]);

  // Sync defaultShellType with main process
  useEffect(() => {
    window.shellAPI.getDefaultType().then(setDefaultShellType);
    const unsub = window.shellAPI.onDefaultTypeChanged(setDefaultShellType);
    return unsub;
  }, []);

  const createDefaultTab = useCallback(() => {
    const title = defaultShellType === 'cmd' ? 'CMD' : 'PowerShell';
    const cwd = activeFolder || undefined;
    const tab = addTab({ title, shell: defaultShellType, cwd });
    initRoot(tab.id);
    return tab;
  }, [addTab, initRoot, defaultShellType, activeFolder]);

  // Create initial tabs on mount — restore persisted session or create default
  useEffect(() => {
    if (!initialTabCreated.current && defaultShellType && configLoaded) {
      initialTabCreated.current = true;
      window.sessionPersistenceAPI.load().then((state) => {
        if (state.tabs.length > 0) {
          // Restore persisted tabs
          for (const t of state.tabs) {
            const tab = addTab({ title: t.title, shell: t.shell, cwd: t.cwd });
            initRoot(tab.id);
          }
          // Restore active tab
          const restoredTabs = useTabStore.getState().tabs;
          const idx = state.activeTabIndex;
          if (idx >= 0 && idx < restoredTabs.length) {
            useTabStore.getState().setActiveTab(restoredTabs[idx].id);
          }
          // Restore workspace visibility
          if (state.workspaceVisible) {
            setWsVisible(true);
          }
          // Restore history visibility
          if (state.historyVisible) {
            setShowHistory(true);
          }
        } else {
          createDefaultTab();
        }
        sessionLoaded.current = true;
      }).catch(() => {
        createDefaultTab();
        sessionLoaded.current = true;
      });
    }
  }, [createDefaultTab, defaultShellType, configLoaded, addTab, initRoot, setWsVisible]);

  // Persist session state when tabs or layout change
  useEffect(() => {
    if (!sessionLoaded.current) return;
    const state = {
      tabs: tabs.map(t => ({ title: t.title, shell: t.shell, cwd: t.cwd })),
      activeTabIndex: tabs.findIndex(t => t.id === activeTabId),
      workspaceVisible: wsVisible,
      historyVisible: showHistory,
    };
    window.sessionPersistenceAPI.save(state);
    window.sessionPersistenceAPI.syncHistory(showHistory);
  }, [tabs, activeTabId, wsVisible, showHistory]);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  // Register commands
  useEffect(() => {
    registerCommands([
      { id: 'cmd.new-tab', label: 'New Tab', description: 'Create a new terminal tab', keys: 'Ctrl+Shift+T', action: () => { createDefaultTab(); } },
      { id: 'cmd.settings', label: 'Open Settings', description: 'Open the settings page', keys: 'Ctrl+,', action: openSettings },
      { id: 'cmd.split-h', label: 'Split Horizontally', description: 'Split the current pane horizontally', keys: 'Alt+Shift+D', action: () => { if (activeTabId) { const root = usePaneStore.getState().roots[activeTabId]; if (root) { const id = usePaneStore.getState().focusedPaneId || root.id; split(activeTabId, id, 'horizontal', () => {}); } } } },
      { id: 'cmd.split-v', label: 'Split Vertically', description: 'Split the current pane vertically', keys: 'Alt+Shift+-', action: () => { if (activeTabId) { const root = usePaneStore.getState().roots[activeTabId]; if (root) { const id = usePaneStore.getState().focusedPaneId || root.id; split(activeTabId, id, 'vertical', () => {}); } } } },
    ]);
  }, [createDefaultTab, openSettings, activeTabId, split, registerCommands]);

  const { toggle: toggleCommandPalette } = useCommandStore();
  const { toggle: toggleSearch } = useSearchStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Shift+F - Search
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        toggleSearch();
        return;
      }

      // Ctrl+Shift+P - Command palette
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Ctrl+, - Open settings
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        showSettings ? closeSettings() : openSettings();
        return;
      }

      // Ctrl+Shift+T - New tab
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        createDefaultTab();
        return;
      }

      // Alt+Shift+D / Alt+Shift+- Split pane
      const isPaneKey = e.altKey && e.shiftKey && (e.key === 'D' || e.key === '-' || e.key === 'd' || e.key === '_');
      if (isPaneKey && activeTabId) {
        e.preventDefault();
        const root = usePaneStore.getState().roots[activeTabId];
        if (!root) return;
        const targetId = usePaneStore.getState().focusedPaneId || root.id;
        const direction = e.key === 'D' || e.key === 'd' ? 'horizontal' : 'vertical';
        split(activeTabId, targetId, direction, () => {});
        return;
      }

      // Alt+Shift+Arrow - Pane focus navigation
      if (e.altKey && e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const root = usePaneStore.getState().roots[activeTabId || ''];
        if (!root) return;
        const allPaneIds: string[] = [];
        function collectIds(node: import('./store/paneStore').PaneNode) {
          if (node.type === 'terminal') allPaneIds.push(node.id);
          if (node.type === 'split') node.children.forEach(collectIds);
        }
        collectIds(root);
        const focusedId = usePaneStore.getState().focusedPaneId;
        const currentIdx = allPaneIds.indexOf(focusedId || '');
        let nextIdx: number;
        switch (e.key) {
          case 'ArrowRight': case 'ArrowDown': nextIdx = (currentIdx + 1) % allPaneIds.length; break;
          case 'ArrowLeft': case 'ArrowUp': nextIdx = (currentIdx - 1 + allPaneIds.length) % allPaneIds.length; break;
          default: nextIdx = 0;
        }
        if (allPaneIds[nextIdx]) usePaneStore.getState().focusPane(allPaneIds[nextIdx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTabId, createDefaultTab, split, openSettings, closeSettings, showSettings, toggleCommandPalette]);

  // Find active session ID for the search overlay
  const activeSessionId = (() => {
    if (!activeTabId) return '';
    const root = usePaneStore.getState().roots[activeTabId];
    if (!root) return '';
    const focusedId = usePaneStore.getState().focusedPaneId;
    function findSession(node: import('./store/paneStore').PaneNode): string {
      if (node.type === 'terminal') {
        if (!focusedId || node.id === focusedId) return node.sessionId;
        return '';
      }
      for (const c of node.children) {
        const r = findSession(c);
        if (r) return r;
      }
      return '';
    }
    return findSession(root);
  })();

  if (showSettings) {
    return <SettingsPage onClose={closeSettings} />;
  }

  return (
    <div className="app-container">
      {wsVisible && <WorkspacePanel />}
      <div className="app-main">
        <TabBar defaultShellType={defaultShellType} />
        <div className="main-area">
          <div className="terminal-area">
            {tabs.length === 0 && activeFolder && (
              <div className="workspace-empty-state">
                <svg viewBox="0 0 16 16" width="48" height="48">
                  <path d="M1 3.5A1.5 1.5 0 012.5 2h3.3l1.5 1.2h5.2A1.5 1.5 0 0114 4.7v7.8a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5V3.5z" fill="#dcb67a" stroke="#dcb67a" strokeWidth="0.3" opacity="0.5" />
                </svg>
                <span className="folder-name">{activeFolder.split(/[\\/]/).pop()}</span>
                <span className="hint">Press <kbd>Ctrl+Shift+T</kbd> or click <kbd>+</kbd> to open a terminal here</span>
              </div>
            )}
            {tabs.length === 0 && !activeFolder && (
              <div className="empty-state">
                <p>Press <kbd>Ctrl+Shift+T</kbd> to open a new terminal</p>
              </div>
            )}
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`terminal-wrapper ${tab.id === activeTabId ? 'visible' : 'hidden'}`}
              >
                <PaneLayout tabId={tab.id} />
              </div>
            ))}
          </div>
          {showHistory && (
            <div className="history-sidebar">
              <HistoryPanel onClose={() => setShowHistory(false)} embedded activeSessionId={activeSessionId} />
            </div>
          )}
        </div>
      </div>
      {activeSessionId && <SearchOverlay sessionId={activeSessionId} />}
      <CommandPalette />
      {showPromptTool && <PromptTool onClose={() => setShowPromptTool(false)} />}
    </div>
  );
};

export default App;
