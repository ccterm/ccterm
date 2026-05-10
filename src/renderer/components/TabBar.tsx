import React, { useCallback, useRef, useState } from 'react';
import { useTabStore } from '../store/tabStore';
import { usePaneStore } from '../store/paneStore';
import '../styles/tabbar.css';

interface ContextMenuState {
  x: number;
  y: number;
  tabId: string;
}

const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, removeTab, addTab, closeOtherTabs, closeRightTabs, reorderTabs } =
    useTabStore();
  const initRoot = usePaneStore((s) => s.initRoot);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  const handleTabClick = useCallback(
    (id: string) => {
      setActiveTab(id);
    },
    [setActiveTab]
  );

  const handleTabClose = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      removeTab(id);
    },
    [removeTab]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId: id });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== toIndex) {
        reorderTabs(dragIndex, toIndex);
      }
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [dragIndex, reorderTabs]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  // Close context menu on click outside
  React.useEffect(() => {
    const handler = () => closeContextMenu();
    if (contextMenu) {
      window.addEventListener('click', handler);
      return () => window.removeEventListener('click', handler);
    }
  }, [contextMenu, closeContextMenu]);

  return (
    <div className="tab-bar" ref={tabBarRef}>
      <div className="tab-list">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`tab-item ${tab.id === activeTabId ? 'active' : ''} ${
              dragOverIndex === index ? 'drag-over' : ''
            }`}
            onClick={() => handleTabClick(tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="none" width="16" height="16">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 8h20" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="tab-title">{tab.title}</span>
            <button
              className="tab-close"
              onClick={(e) => handleTabClose(e, tab.id)}
              title="Close tab"
            >
              <svg viewBox="0 0 16 16" width="12" height="12">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ))}
        <button
          className="tab-new"
          onClick={() => { const tab = addTab({ title: 'Terminal' }); initRoot(tab.id); }}
          title="New tab (Ctrl+Shift+T)"
        >
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="tab-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="context-menu-item" onClick={() => { closeOtherTabs(contextMenu.tabId); closeContextMenu(); }}>
            Close Other Tabs
          </div>
          <div className="context-menu-item" onClick={() => { closeRightTabs(contextMenu.tabId); closeContextMenu(); }}>
            Close Tabs to the Right
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item" onClick={() => { removeTab(contextMenu.tabId); closeContextMenu(); }}>
            Close
          </div>
        </div>
      )}
    </div>
  );
};

export default TabBar;
