import React, { useCallback, useEffect, useRef, useState } from 'react';
import TabBar from './components/TabBar';
import PaneLayout from './components/PaneLayout';
import SettingsPage from './components/SettingsPage';
import CommandPalette from './components/CommandPalette';
import SearchOverlay from './components/SearchOverlay';
import HistoryPanel from './components/HistoryPanel';
import PromptTool from './components/PromptTool';
import WorkspacePanel from './components/WorkspacePanel';
import MenuBar from './components/MenuBar';
import QrCodePanel from './components/QrCodePanel';
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
  const activeTab = tabs.find(t => t.id === activeTabId);
  const statusCwd = activeTab?.cwd || activeFolder || '';
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPromptTool, setShowPromptTool] = useState(false);
  const [defaultShellType, setDefaultShellType] = useState<string>('cmd');
  const [remoteRunning, setRemoteRunning] = useState(false);
  const [relayConnected, setRelayConnected] = useState(false);
  const [relayServerUrl, setRelayServerUrl] = useState('');
  const [relayError, setRelayError] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeMode, setQrCodeMode] = useState<'lan' | 'relay'>('lan');
  const initialTabCreated = useRef(false);
  const sessionLoaded = useRef(false);

  // Load config on startup
  useEffect(() => {
    loadConfig().then(() => {
      const cfg = useConfigStore.getState().config;
      if (cfg?.remoteControl?.relayServerUrl) {
        setRelayServerUrl(cfg.remoteControl.relayServerUrl);
      }
    });
  }, [loadConfig]);

  // Load workspace folders on mount
  useEffect(() => {
    window.workspaceAPI.getAll().then(setFolders);
  }, [setFolders]);

  // Sync defaultShellType and remote status with main process
  useEffect(() => {
    window.shellAPI.getDefaultType().then(setDefaultShellType);
    const unsub = window.shellAPI.onDefaultTypeChanged(setDefaultShellType);
    window.remoteAPI.isRunning().then(setRemoteRunning);
    window.relayAPI.isConnected().then(setRelayConnected);
    const unsubRelay = window.relayAPI.onStatus((status) => setRelayConnected(status.connected));
    return () => { unsub(); unsubRelay(); };
  }, []);

  // Sync defaultShellType changes back to main process
  useEffect(() => {
    window.shellAPI.setDefaultType(defaultShellType);
  }, [defaultShellType]);

  // Listen for remote tab creation from phone
  useEffect(() => {
    const unsub = window.appAPI.onRemoteCreateTab((shellType: string, cwd?: string) => {
      const title = shellType === 'cmd' ? 'CMD' : 'PowerShell';
      const dir = cwd || activeFolder || undefined;
      const tab = addTab({ title, shell: shellType, cwd: dir });
      initRoot(tab.id);
      useTabStore.getState().setActiveTab(tab.id);
    });
    return unsub;
  }, [addTab, initRoot, activeFolder]);

  // Listen for remote tab activation from phone
  useEffect(() => {
    const unsub = window.appAPI.onRemoteActivateTab((sessionId: string) => {
      const roots = usePaneStore.getState().roots;
      for (const [tabId, root] of Object.entries(roots)) {
        function hasSession(node: import('./store/paneStore').PaneNode): boolean {
          if (node.type === 'terminal') return node.sessionId === sessionId;
          return node.children.some(hasSession);
        }
        if (hasSession(root)) {
          useTabStore.getState().setActiveTab(tabId);
          break;
        }
      }
    });
    return unsub;
  }, []);

  // Listen for remote workspace folder activation from phone
  useEffect(() => {
    const unsub = window.appAPI.onRemoteActivateWorkspace((folder: string) => {
      useWorkspaceStore.getState().setActiveFolder(folder);
      const nf = folder.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
      const tabs = useTabStore.getState().tabs;
      const match = tabs.find(t => {
        const tcwd = (t.cwd || '').replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
        return tcwd.startsWith(nf);
      });
      if (match) {
        useTabStore.getState().setActiveTab(match.id);
      }
    });
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
  }, [tabs, activeTabId, wsVisible, showHistory]);

  // Push active tab change to remote server (for phone sync)
  useEffect(() => {
    if (!activeTabId) return;
    const root = usePaneStore.getState().roots[activeTabId];
    if (!root) return;
    const focusedId = usePaneStore.getState().focusedPaneId;
    function findPaneSession(node: import('./store/paneStore').PaneNode): string {
      if (node.type === 'terminal') {
        if (!focusedId || node.id === focusedId) return node.sessionId;
        return '';
      }
      for (const c of node.children) {
        const r = findPaneSession(c);
        if (r) return r;
      }
      return '';
    }
    const paneSessionId = findPaneSession(root);
    if (paneSessionId) {
      window.remoteAPI.setActiveSession(paneSessionId);
    }
  }, [activeTabId, tabs]);

  // Poll server for phone-initiated tab switches
  useEffect(() => {
    let lastSessionId = '';
    const interval = setInterval(async () => {
      const sessionId = await window.remoteAPI.getActiveSession();
      if (sessionId && sessionId !== lastSessionId) {
        lastSessionId = sessionId;
        // Find tab whose pane has this sessionId (paneStore format, not tabStore)
        const roots = usePaneStore.getState().roots;
        for (const [tabId, root] of Object.entries(roots)) {
          function hasSession(node: import('./store/paneStore').PaneNode): boolean {
            if (node.type === 'terminal') return node.sessionId === sessionId;
            return node.children.some(hasSession);
          }
          if (hasSession(root)) {
            useTabStore.getState().setActiveTab(tabId);
            break;
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  const handleOpenQrCode = useCallback(async () => {
    const running = await window.remoteAPI.isRunning();
    if (!running) {
      const started = await window.remoteAPI.toggle();
      if (!started) return;
    }
    const url = await window.remoteAPI.getRemoteUrl();
    setQrCodeUrl(url);
    setQrCodeMode('lan');
    setShowQrCode(true);
  }, []);

  const handleToggleRelay = useCallback(async () => {
    // Refresh relayServerUrl from config
    const cfg = useConfigStore.getState().config;
    const savedUrl = cfg?.remoteControl?.relayServerUrl || '';

    if (relayConnected) {
      // Disconnect
      await window.relayAPI.toggle();
      setShowQrCode(false);
      return;
    }

    if (!savedUrl) {
      // No relay server configured — show setup panel
      setQrCodeUrl('');
      setRelayError('');
      setQrCodeMode('relay');
      setShowQrCode(true);
      return;
    }

    // Try to connect
    const result = await window.relayAPI.toggle();
    if (result.connected) {
      setRelayServerUrl(savedUrl);
      setQrCodeUrl(result.phoneUrl);
      setQrCodeMode('relay');
      setShowQrCode(true);
    } else if (result.error) {
      setRelayError(result.error);
      setQrCodeUrl('');
      setQrCodeMode('relay');
      setShowQrCode(true);
    }
  }, [relayConnected]);

  const handleRelayConnect = useCallback(async (serverUrl: string) => {
    setRelayError('');
    // Save to config
    const cfg = useConfigStore.getState().config;
    if (cfg) {
      const rc = { ...cfg.remoteControl, relayServerUrl: serverUrl };
      useConfigStore.getState().updateRemote(rc);
      await useConfigStore.getState().save();
    }
    setRelayServerUrl(serverUrl);

    // Try connecting via IPC
    const result = await window.relayAPI.toggle();
    if (result.connected) {
      setQrCodeUrl(result.phoneUrl);
    } else if (result.error) {
      setRelayError(result.error);
    }
  }, []);

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

      // Ctrl+Shift+H - Toggle history
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        setShowHistory((v) => !v);
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

  const menuBar = (
    <MenuBar
      defaultShellType={defaultShellType}
      onSetDefaultShellType={setDefaultShellType}
      workspaceVisible={wsVisible}
      onToggleWorkspace={() => setWsVisible(!wsVisible)}
      historyVisible={showHistory}
      onToggleHistory={() => setShowHistory((v) => !v)}
      onTogglePromptTool={() => setShowPromptTool((v) => !v)}
      onNewTab={createDefaultTab}
      onSplitVertical={() => {
        if (!activeTabId) return;
        const root = usePaneStore.getState().roots[activeTabId];
        if (!root) return;
        const id = usePaneStore.getState().focusedPaneId || root.id;
        split(activeTabId, id, 'vertical', () => {});
      }}
      onOpenSettings={openSettings}
      onToggleSearch={toggleSearch}
      onToggleRemote={async () => {
        const v = await window.remoteAPI.toggle();
        setRemoteRunning(v);
      }}
      remoteRunning={remoteRunning}
      onOpenQrCode={handleOpenQrCode}
      relayConnected={relayConnected}
      onToggleRelay={handleToggleRelay}
    />
  );

  if (showSettings) {
    return (
      <div className="app-root">
        {menuBar}
        <SettingsPage onClose={closeSettings} />
        {showQrCode && (
          <QrCodePanel
            url={qrCodeUrl}
            onClose={() => { setShowQrCode(false); setRelayError(''); }}
            relayMode={qrCodeMode === 'relay'}
            relayServerUrl={relayServerUrl}
            onRelayConnect={qrCodeMode === 'relay' ? handleRelayConnect : undefined}
            relayError={relayError}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-root">
      {menuBar}
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
      <div className="status-bar">
        <span className="status-bar-cwd" title={statusCwd}>{statusCwd}</span>
      </div>
      {showQrCode && (
        <QrCodePanel
          url={qrCodeUrl}
          onClose={() => { setShowQrCode(false); setRelayError(''); }}
          relayMode={qrCodeMode === 'relay'}
          relayServerUrl={relayServerUrl}
          onRelayConnect={qrCodeMode === 'relay' ? handleRelayConnect : undefined}
          relayError={relayError}
        />
      )}
    </div>
  );
};

export default App;
