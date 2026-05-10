import React, { useCallback, useRef, useState } from 'react';
import TerminalView from './TerminalView';
import ErrorBoundary from './ErrorBoundary';
import { usePaneStore, type PaneNode } from '../store/paneStore';
import '../styles/pane.css';

interface PaneLayoutProps {
  tabId: string;
}

interface PaneRendererProps {
  node: PaneNode;
  tabId: string;
  depth: number;
}

const PaneRenderer: React.FC<PaneRendererProps> = ({ node, tabId, depth }) => {
  const { focusedPaneId, focusPane, split, closePane } = usePaneStore();

  if (node.type === 'terminal') {
    const isFocused = focusedPaneId === node.id;
    return (
      <div
        className={`pane-terminal ${isFocused ? 'focused' : ''}`}
        onClick={() => focusPane(node.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          // Context menu could be added here
        }}
      >
        <ErrorBoundary>
          <TerminalView tabId={tabId} sessionId={node.sessionId} />
        </ErrorBoundary>
        {depth > 0 && (
          <button className="pane-close-btn" onClick={() => closePane(tabId, node.id)} title="Close pane">
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <SplitContainer node={node} tabId={tabId} depth={depth} />
  );
};

const SplitContainer: React.FC<PaneRendererProps> = ({ node, tabId, depth }) => {
  if (node.type !== 'split') return null;

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ index: number; startPos: number; startSizes: number[] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const isHorizontal = node.direction === 'horizontal';
      const startPos = isHorizontal ? e.clientX : e.clientY;

      dragging.current = { index, startPos, startSizes: [...node.sizes] };
      setIsDragging(true);

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        const { index, startPos, startSizes } = dragging.current;
        const currentPos = isHorizontal ? e.clientX : e.clientY;
        const delta = currentPos - startPos;
        const totalSize = isHorizontal ? rect.width : rect.height;

        const newSizes = [...startSizes];
        const minSize = 0.1;

        const deltaRatio = delta / totalSize;
        newSizes[index] = Math.max(minSize, startSizes[index] + deltaRatio);
        newSizes[index + 1] = Math.max(minSize, startSizes[index + 1] - deltaRatio);

        // Normalize
        const sum = newSizes.reduce((a, b) => a + b, 0);
        const normalized = newSizes.map((s) => s / sum);

        usePaneStore.getState().updateSizes(tabId, node.id, normalized);
      };

      const handleMouseUp = () => {
        dragging.current = null;
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [node.direction, node.id, node.sizes, tabId]
  );

  const totalFlex = node.sizes.reduce((a, b) => a + b, 0);

  return (
    <div
      ref={containerRef}
      className={`pane-split ${node.direction} ${isDragging ? 'dragging' : ''}`}
    >
      {node.children.map((child, index) => (
        <React.Fragment key={child.id}>
          <div
            className="pane-child"
            style={{ flex: node.sizes[index] / totalFlex }}
          >
            <PaneRenderer node={child} tabId={tabId} depth={depth + 1} />
          </div>
          {index < node.children.length - 1 && (
            <div
              className={`pane-divider ${node.direction}`}
              onMouseDown={(e) => handleMouseDown(index, e)}
            >
              <div className="pane-divider-handle" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const PaneLayout: React.FC<PaneLayoutProps> = ({ tabId }) => {
  const root = usePaneStore((s) => s.roots[tabId]);
  const initRoot = usePaneStore((s) => s.initRoot);

  if (!root) {
    initRoot(tabId);
    return null;
  }

  return (
    <div className="pane-layout">
      <PaneRenderer node={root} tabId={tabId} depth={0} />
    </div>
  );
};

export default PaneLayout;
