import React, { useCallback, useEffect, useState } from 'react';
import '../styles/prompttool.css';

interface PromptTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: number;
  updatedAt: number;
}

const CATEGORIES = ['General', 'Coding', 'Writing', 'Analysis', 'Custom'];

const PromptTool: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [filterCat, setFilterCat] = useState('');
  const [editing, setEditing] = useState<PromptTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    const all = await window.promptAPI.getAll();
    setPrompts(all);
  };

  const handleSave = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;
    await window.promptAPI.save({
      id: editing?.id,
      title: title.trim(),
      content: content.trim(),
      category,
    });
    setShowForm(false);
    setEditing(null);
    setTitle('');
    setContent('');
    setCategory('General');
    loadPrompts();
  }, [title, content, category, editing]);

  const handleEdit = useCallback((p: PromptTemplate) => {
    setEditing(p);
    setTitle(p.title);
    setContent(p.content);
    setCategory(p.category);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await window.promptAPI.delete(id);
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleCopy = useCallback(async (text: string) => {
    await window.clipboardAPI.write(text);
  }, []);

  const handleNew = useCallback(() => {
    setEditing(null);
    setTitle('');
    setContent('');
    setCategory('General');
    setShowForm(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showForm) {
          setShowForm(false);
          setEditing(null);
        } else {
          onClose();
        }
      }
      if (e.ctrlKey && e.key === 'Enter' && showForm) {
        handleSave();
      }
    },
    [onClose, showForm, handleSave]
  );

  const filtered = prompts.filter((p) => {
    if (filterCat && p.category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !p.content.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="prompt-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="prompt-panel" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-header">
          <h2>Prompt Tool</h2>
          <div className="prompt-header-actions">
            <button className="prompt-btn primary" onClick={handleNew}>+ New</button>
            <button className="prompt-btn" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="prompt-toolbar">
          <input
            className="prompt-search"
            type="text"
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="prompt-cat-select"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {showForm && (
          <div className="prompt-form">
            <input
              className="prompt-form-input"
              type="text"
              placeholder="Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <select
              className="prompt-form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <textarea
              className="prompt-form-textarea"
              placeholder="Prompt content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
            <div className="prompt-form-actions">
              <button className="prompt-btn primary" onClick={handleSave}>
                {editing ? 'Update' : 'Save'}
              </button>
              <button className="prompt-btn" onClick={() => { setShowForm(false); setEditing(null); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="prompt-list">
          {filtered.length === 0 && (
            <div className="prompt-empty">
              {search || filterCat ? 'No matching prompts' : 'No prompts yet. Click "+ New" to create one.'}
            </div>
          )}
          {filtered.map((p) => (
            <div key={p.id} className="prompt-item">
              <div className="prompt-item-header">
                <span className="prompt-item-title">{p.title}</span>
                <span className="prompt-item-cat">{p.category}</span>
              </div>
              <div className="prompt-item-content">{p.content.slice(0, 200)}{p.content.length > 200 ? '...' : ''}</div>
              <div className="prompt-item-actions">
                <button className="prompt-item-btn" onClick={() => handleCopy(p.content)} title="Copy">
                  Copy
                </button>
                <button className="prompt-item-btn" onClick={() => handleEdit(p)} title="Edit">
                  Edit
                </button>
                <button className="prompt-item-btn danger" onClick={() => handleDelete(p.id)} title="Delete">
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromptTool;
