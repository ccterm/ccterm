import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../styles/history.css';

interface CommandRecord {
  id: string;
  command: string;
  timestamp: number;
  directory: string;
  sessionId: string;
  profile: string;
  exitCode: number | null;
  favorite: boolean;
}

interface HistoryStats {
  total: number;
  today: number;
  favorites: number;
  topCommands: Array<{ command: string; count: number }>;
}

type ViewMode = 'list' | 'favorites' | 'stats';

type CwdMode = 'current' | 'all';

interface ContextMenuState {
  x: number;
  y: number;
  recordId?: string;
  command?: string;
}

const HistoryPanel: React.FC<{ onClose: () => void; embedded?: boolean; activeSessionId?: string }> = ({ onClose, embedded, activeSessionId }) => {
  const [allRecords, setAllRecords] = useState<CommandRecord[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [cwdMode, setCwdMode] = useState<CwdMode>('current');
  const [currentCwd, setCurrentCwd] = useState<string>('');
  const [filterPatterns, setFilterPatterns] = useState<string[]>([]);
  const [filterActive, setFilterActive] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterTextarea, setFilterTextarea] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Load data + auto-refresh on new records
  useEffect(() => {
    loadData();
    const unsub = window.historyAPI.onNewRecord(() => {
      loadData();
    });
    return unsub;
  }, [viewMode]);

  // Track current directory from active session
  useEffect(() => {
    if (!activeSessionId) return;
    window.shellAPI.getCwd(activeSessionId).then(setCurrentCwd);
    const unsub = window.shellAPI.onCwdChanged(activeSessionId, (cwd: string) => {
      setCurrentCwd(cwd);
    });
    return unsub;
  }, [activeSessionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (viewMode === 'stats') {
        const s = await window.historyAPI.stats();
        setStats(s);
      } else if (viewMode === 'favorites') {
        const favs = await window.historyAPI.getFavorites();
        setAllRecords(favs);
      } else {
        const all = await window.historyAPI.getAll();
        setAllRecords(all);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  // Derive displayed records with all filters applied
  const displayedRecords = useMemo(() => {
    let result = allRecords;
    if (cwdMode === 'current' && currentCwd) {
      const normalized = currentCwd.replace(/\\/g, '/').toLowerCase();
      result = result.filter((r) => {
        const d = (r.directory || '').replace(/\\/g, '/').toLowerCase();
        return d === normalized || d.startsWith(normalized + '/');
      });
    }
    if (filterActive && filterPatterns.length > 0) {
      result = result.filter((r) => {
        const cmd = r.command.toLowerCase();
        return !filterPatterns.some((p) => p.trim() && cmd.includes(p.trim().toLowerCase()));
      });
    }
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter((r) => r.command.toLowerCase().includes(lower));
    }
    return result;
  }, [allRecords, cwdMode, currentCwd, filterActive, filterPatterns, search]);

  const handleSearch = useCallback(async (q: string) => {
    setSearch(q);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await window.historyAPI.delete(id);
    setAllRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleToggleFav = useCallback(async (id: string) => {
    const isFav = await window.historyAPI.toggleFavorite(id);
    setAllRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, favorite: isFav } : r))
    );
  }, []);

  const handleClearAll = useCallback(async () => {
    await window.historyAPI.clear();
    setAllRecords([]);
  }, []);

  const handleCopy = useCallback((cmd: string) => {
    window.clipboardAPI.write(cmd);
  }, []);

  const handleExport = useCallback(async () => {
    const patterns = filterActive ? filterPatterns.filter((p) => p.trim()) : [];
    await window.historyAPI.exportHistory(patterns);
    setContextMenu(null);
  }, [filterActive, filterPatterns]);

  const handleRefresh = useCallback(() => {
    loadData();
    setContextMenu(null);
  }, [viewMode]);

  const handleIgnore = useCallback((command: string) => {
    const firstWord = command.split(/\s+/)[0] || command;
    setFilterPatterns((prev) => {
      if (prev.some((p) => p.trim().toLowerCase() === firstWord.toLowerCase())) return prev;
      return [...prev, firstWord];
    });
    if (!filterActive) setFilterActive(true);
  }, [filterActive]);

  const openFilterDialog = useCallback(() => {
    setFilterTextarea(filterPatterns.join('\n'));
    setFilterDialogOpen(true);
  }, [filterPatterns]);

  const applyFilterDialog = useCallback(() => {
    const patterns = filterTextarea
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    setFilterPatterns(patterns);
    setFilterDialogOpen(false);
  }, [filterTextarea]);

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, recordId: string, command: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, recordId, command });
  }, []);

  const handlePanelContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => closeContextMenu();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu, closeContextMenu]);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  const panel = (
      <div className={`history-panel${embedded ? ' history-panel-embedded' : ''}`} onClick={(e) => e.stopPropagation()} onContextMenu={handlePanelContextMenu}>
        <div className="history-header">
          <h2>Command History</h2>
          <div className="history-header-actions">
            <button
              className={`history-tab ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              All
            </button>
            <button
              className={`history-tab ${viewMode === 'favorites' ? 'active' : ''}`}
              onClick={() => setViewMode('favorites')}
            >
              ★ Favorites
            </button>
            <button
              className={`history-tab ${viewMode === 'stats' ? 'active' : ''}`}
              onClick={() => setViewMode('stats')}
            >
              Stats
            </button>
            <div className="history-spacer" />
            {!embedded && <button className="history-btn" onClick={onClose}>Close</button>}
          </div>
        </div>

        {viewMode !== 'stats' && (
          <div className="history-toolbar">
            <div className="history-search">
              <input
                className="history-search-input"
                type="text"
                placeholder="Search commands..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="history-cwd-radio">
              <label className={`cwd-radio-label${cwdMode === 'current' ? ' active' : ''}`}>
                <input
                  type="radio"
                  name="cwdMode"
                  checked={cwdMode === 'current'}
                  onChange={() => setCwdMode('current')}
                />
                <span>Current Dir</span>
              </label>
              <label className={`cwd-radio-label${cwdMode === 'all' ? ' active' : ''}`}>
                <input
                  type="radio"
                  name="cwdMode"
                  checked={cwdMode === 'all'}
                  onChange={() => setCwdMode('all')}
                />
                <span>All</span>
              </label>
            </div>
            <button
              className={`filter-btn${filterActive && filterPatterns.length > 0 ? ' active' : ''}`}
              onClick={openFilterDialog}
              title={filterActive && filterPatterns.length > 0 ? `Filtering: ${filterPatterns.join(', ')}` : 'Filter commands'}
            >
              Filter{filterActive && filterPatterns.length > 0 ? ` (${filterPatterns.length})` : ''}
            </button>
          </div>
        )}

        <div className="history-body">
          {loading && <div className="history-empty">Loading...</div>}

          {!loading && viewMode === 'stats' && stats && (
            <div className="history-stats">
              <div className="stat-cards">
                <div className="stat-card">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total Commands</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.today}</div>
                  <div className="stat-label">Today</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.favorites}</div>
                  <div className="stat-label">Favorites</div>
                </div>
              </div>
              <h3>Top Commands</h3>
              <div className="top-commands">
                {stats.topCommands.map((t, i) => (
                  <div key={t.command} className="top-command-row">
                    <span className="top-command-rank">#{i + 1}</span>
                    <span className="top-command-name">{t.command}</span>
                    <span className="top-command-count">{t.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && viewMode !== 'stats' && displayedRecords.length === 0 && (
            <div className="history-empty">
              {search ? 'No matching commands' : (cwdMode === 'current' && currentCwd ? `No commands in ${currentCwd}` : 'No command history yet')}
            </div>
          )}

          {!loading && viewMode !== 'stats' && (
            <div className="history-list">
              {displayedRecords.map((record) => (
                <div
                  key={record.id}
                  className="history-item"
                  onContextMenu={(e) => handleContextMenu(e, record.id, record.command)}
                >
                  <div className="history-item-main">
                    <code className="history-item-command">{record.command}</code>
                    <div className="history-item-meta">
                      <span>{formatDate(record.timestamp)}</span>
                      {record.directory && (
                        <span className="history-item-dir" title={record.directory}>{basename(record.directory)}</span>
                      )}
                      {record.exitCode !== null && (
                        <span className={`exit-code ${record.exitCode === 0 ? 'success' : 'error'}`}>
                          exit: {record.exitCode}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="history-item-actions">
                    <button
                      className={`history-item-btn ${record.favorite ? 'fav' : ''}`}
                      onClick={() => handleToggleFav(record.id)}
                      title={record.favorite ? 'Unfavorite' : 'Favorite'}
                    >
                      {record.favorite ? '★' : '☆'}
                    </button>
                    <button
                      className="history-item-btn"
                      onClick={() => handleCopy(record.command)}
                      title="Copy"
                    >
                      📋
                    </button>
                    <button
                      className="history-item-btn ignore-btn"
                      onClick={() => handleIgnore(record.command)}
                      title="Ignore this command"
                    >
                      ⊘
                    </button>
                    <button
                      className="history-item-btn danger"
                      onClick={() => handleDelete(record.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {viewMode !== 'stats' && displayedRecords.length > 0 && (
          <div className="history-footer">
            <span>{displayedRecords.length} commands</span>
            <button className="history-btn danger" onClick={handleClearAll}>
              Clear All
            </button>
          </div>
        )}

        {/* Filter dialog */}
        {filterDialogOpen && (
          <div className="filter-dialog-overlay" onClick={() => setFilterDialogOpen(false)}>
            <div className="filter-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="filter-dialog-header">
                <h3>Filter Commands</h3>
                <button className="history-btn" onClick={() => setFilterDialogOpen(false)}>✕</button>
              </div>
              <div className="filter-dialog-body">
                <label className="filter-toggle">
                  <span className="filter-toggle-switch">
                    <input
                      type="checkbox"
                      checked={filterActive}
                      onChange={(e) => setFilterActive(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </span>
                  <span className="filter-toggle-label-text">Enable filtering</span>
                </label>
                <label className="filter-textarea-label">
                  Patterns to hide (one per line):
                </label>
                <textarea
                  className="filter-textarea"
                  placeholder="git&#10;npm&#10;node"
                  value={filterTextarea}
                  onChange={(e) => setFilterTextarea(e.target.value)}
                  rows={8}
                />
              </div>
              <div className="filter-dialog-footer">
                <button className="history-btn" onClick={() => setFilterDialogOpen(false)}>Cancel</button>
                <button className="history-btn filter-apply-btn" onClick={applyFilterDialog}>Apply</button>
              </div>
            </div>
          </div>
        )}

        {contextMenu && (
          <div className="history-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
            <div className="context-menu-item" onClick={handleRefresh}>
              Refresh
            </div>
            <div className="context-menu-divider" />
            {contextMenu.command && (
              <div className="context-menu-item" onClick={() => { handleCopy(contextMenu.command!); closeContextMenu(); }}>
                Copy
              </div>
            )}
            {contextMenu.recordId && (
              <div className="context-menu-item danger" onClick={() => { handleDelete(contextMenu.recordId!); closeContextMenu(); }}>
                Delete
              </div>
            )}
            <div className="context-menu-divider" />
            <div className="context-menu-item" onClick={handleExport}>
              Export All...
            </div>
          </div>
        )}
      </div>
  );

  if (embedded) {
    return <div className="history-embedded" onKeyDown={handleKeyDown}>{panel}</div>;
  }

  return (
    <div className="history-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      {panel}
    </div>
  );
};

function basename(p: string): string {
  return p.split(/[\\/]/).pop() || p;
}

export default HistoryPanel;
