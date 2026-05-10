import React, { useEffect, useRef } from 'react';
import { useSearchStore } from '../store/searchStore';
import '../styles/search.css';

interface Props {
  sessionId: string;
}

const SearchOverlay: React.FC<Props> = ({ sessionId }) => {
  const {
    isOpen, close, query, setQuery,
    caseSensitive, setCaseSensitive,
    regex, setRegex, wholeWord, setWholeWord,
    findNext, findPrev,
  } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (e.shiftKey) findPrev(sessionId);
        else findNext(sessionId);
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay">
      <div className="search-bar">
        <input
          ref={inputRef}
          className="search-input"
          type="text"
          placeholder="Find..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="search-actions">
          <button
            className={`search-toggle ${caseSensitive ? 'active' : ''}`}
            onClick={() => setCaseSensitive(!caseSensitive)}
            title="Case Sensitive"
          >
            Aa
          </button>
          <button
            className={`search-toggle ${regex ? 'active' : ''}`}
            onClick={() => setRegex(!regex)}
            title="Use Regular Expression"
          >
            .*
          </button>
          <button
            className={`search-toggle ${wholeWord ? 'active' : ''}`}
            onClick={() => setWholeWord(!wholeWord)}
            title="Whole Word"
          >
            ab
          </button>
        </div>
        <div className="search-nav">
          <button className="search-nav-btn" onClick={() => findPrev(sessionId)} title="Previous (Shift+Enter)">
            <svg viewBox="0 0 16 16" width="14" height="14"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="search-nav-btn" onClick={() => findNext(sessionId)} title="Next (Enter)">
            <svg viewBox="0 0 16 16" width="14" height="14"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="search-close-btn" onClick={close}>
            <svg viewBox="0 0 16 16" width="12" height="12"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
