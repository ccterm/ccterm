import React, { useCallback, useEffect, useRef, useState } from 'react';
import TabBar from './components/TabBar';
import PaneLayout from './components/PaneLayout';
import SettingsPage from './components/SettingsPage';
import CommandPalette from './components/CommandPalette';
import SearchOverlay from './components/SearchOverlay';
import HistoryPanel from './components/HistoryPanel';
import { useTabStore } from './store/tabStore';
import { usePaneStore } from './store/paneStore';
import { useCommandStore } from './store/commandStore';
import { useSearchStore } from './store/searchStore';
import { useConfigStore } from './store/configStore';
import './styles/global.css';

const App: React.FC = () => {
  const { tabs, activeTabId, addTab } = useTabStore();
  const { split, initRoot } = usePaneStore();
  const { registerCommands } = useCommandStore();
  const { load: loadConfig } = useConfigStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const initialTabCreated = useRef(false);

  // Load config on startup
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Create initial tab on mount (no IPC race condition)
  useEffect(() => {
    console.log('[CCTerm] Initial tab creation check:', { tabsLength: tabs.length, alreadyCreated: initialTabCreated.current });
    if (!initialTabCreated.current && tabs.length === 0) {
      initialTabCreated.current = true;
      console.log('[CCTerm] Creating initial tab');
      const tab = addTab({ title: 'Terminal' });
      initRoot(tab.id);
      console.log('[CCTerm] Initial tab created:', tab.id);
    }
  }, [addTab, initRoot, tabs.length]);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  // Register commands
  useEffect(() => {
    registerCommands([
      { id: 'cmd.new-tab', label: 'New Tab', description: 'Create a new terminal tab', keys: 'Ctrl+Shift+T', action: () => { const tab = addTab({ title: 'Terminal' }); initRoot(tab.id); } },
      { id: 'cmd.settings', label: 'Open Settings', description: 'Open the settings page', keys: 'Ctrl+,', action: openSettings },
      { id: 'cmd.split-h', label: 'Split Horizontally', description: 'Split the current pane horizontally', keys: 'Alt+Shift+D', action: () => { if (activeTabId) { const root = usePaneStore.getState().roots[activeTabId]; if (root) { const id = usePaneStore.getState().focusedPaneId || root.id; split(activeTabId, id, 'horizontal', () => {}); } } } },
      { id: 'cmd.split-v', label: 'Split Vertically', description: 'Split the current pane vertically', keys: 'Alt+Shift+-', action: () => { if (activeTabId) { const root = usePaneStore.getState().roots[activeTabId]; if (root) { const id = usePaneStore.getState().focusedPaneId || root.id; split(activeTabId, id, 'vertical', () => {}); } } } },
    ]);
  }, [addTab, initRoot, openSettings, activeTabId, split, registerCommands]);

  const { toggle: toggleCommandPalette } = useCommandStore();
  const { toggle: toggleSearch } = useSearchStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Shift+H - Command history
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        setShowHistory((v) => !v);
        return;
      }

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
        const tab = addTab({ title: 'Terminal' });
        initRoot(tab.id);
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
  }, [activeTabId, addTab, initRoot, split, openSettings, closeSettings, showSettings, toggleCommandPalette]);

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
      <TabBar />
      <div className="terminal-area">
        {tabs.length === 0 && (
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
      {activeSessionId && <SearchOverlay sessionId={activeSessionId} />}
      <CommandPalette />
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
    </div>
  );
};

export default App;
