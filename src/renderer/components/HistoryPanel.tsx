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

const HistoryPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [records, setRecords] = useState<CommandRecord[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [viewMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (viewMode === 'stats') {
        const s = await window.historyAPI.stats();
        setStats(s);
      } else if (viewMode === 'favorites') {
        const favs = await window.historyAPI.getFavorites();
        setRecords(favs);
      } else {
        const all = await window.historyAPI.getAll();
        setRecords(all);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleSearch = useCallback(async (q: string) => {
    setSearch(q);
    if (q.trim()) {
      const results = await window.historyAPI.search(q);
      setRecords(results);
    } else {
      const all = await window.historyAPI.getAll();
      setRecords(all);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await window.historyAPI.delete(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleToggleFav = useCallback(async (id: string) => {
    const isFav = await window.historyAPI.toggleFavorite(id);
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, favorite: isFav } : r))
    );
    if (viewMode === 'favorites' && !isFav) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  }, [viewMode]);

  const handleClearAll = useCallback(async () => {
    await window.historyAPI.clear();
    setRecords([]);
  }, []);

  const handleCopy = useCallback((cmd: string) => {
    navigator.clipboard.writeText(cmd);
  }, []);

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

  return (
    <div className="history-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="history-panel" onClick={(e) => e.stopPropagation()}>
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
              📊 Stats
            </button>
            <div className="history-spacer" />
            <button className="history-btn" onClick={onClose}>Close</button>
          </div>
        </div>

        {viewMode !== 'stats' && (
          <div className="history-search">
            <input
              className="history-search-input"
              type="text"
              placeholder="Search commands..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
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

          {!loading && viewMode !== 'stats' && records.length === 0 && (
            <div className="history-empty">
              {search ? 'No matching commands' : 'No command history yet'}
            </div>
          )}

          {!loading && viewMode !== 'stats' && (
            <div className="history-list">
              {records.map((record) => (
                <div key={record.id} className="history-item">
                  <div className="history-item-main">
                    <code className="history-item-command">{record.command}</code>
                    <div className="history-item-meta">
                      <span>{formatDate(record.timestamp)}</span>
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

        {viewMode !== 'stats' && records.length > 0 && (
          <div className="history-footer">
            <span>{records.length} commands</span>
            <button className="history-btn danger" onClick={handleClearAll}>
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
