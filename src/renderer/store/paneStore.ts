import { create } from 'zustand';

export type PaneNode =
  | { type: 'terminal'; id: string; sessionId: string; tabId: string }
  | {
      type: 'split';
      id: string;
      direction: 'horizontal' | 'vertical';
      children: PaneNode[];
      sizes: number[];
    };

function generateId(): string {
  return `pane-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createTerminalNode(tabId: string): PaneNode {
  return {
    type: 'terminal',
    id: generateId(),
    sessionId: generateSessionId(),
    tabId,
  };
}

interface PaneState {
  roots: Record<string, PaneNode>; // tabId -> root pane node
  focusedPaneId: string | null;

  initRoot: (tabId: string) => void;
  split: (tabId: string, paneId: string, direction: 'horizontal' | 'vertical', onNew: (node: PaneNode) => void) => void;
  closePane: (tabId: string, paneId: string) => void;
  focusPane: (paneId: string) => void;
  updateSizes: (tabId: string, splitId: string, sizes: number[]) => void;
  getRoot: (tabId: string) => PaneNode | undefined;
}

function findPane(root: PaneNode, paneId: string): PaneNode | null {
  if (root.id === paneId) return root;
  if (root.type === 'split') {
    for (const child of root.children) {
      const found = findPane(child, paneId);
      if (found) return found;
    }
  }
  return null;
}

function removePane(root: PaneNode, paneId: string): PaneNode | null {
  if (root.type === 'split') {
    const idx = root.children.findIndex((c) => c.id === paneId);
    if (idx >= 0) {
      const newChildren = root.children.filter((_, i) => i !== idx);
      const newSizes = root.sizes.filter((_, i) => i !== idx);
      if (newChildren.length === 1) {
        // Collapse split into single child
        return newChildren[0];
      }
      return { ...root, children: newChildren, sizes: newSizes };
    }
    const newChildren = root.children.map((c) => removePane(c, paneId)).filter(Boolean) as PaneNode[];
    if (newChildren.length === 1) return newChildren[0];
    if (newChildren.length === 0) return null;
    return { ...root, children: newChildren };
  }
  return root;
}

function replaceTerminalNode(root: PaneNode, paneId: string, newNode: PaneNode): PaneNode {
  if (root.id === paneId && root.type === 'terminal') {
    return newNode;
  }
  if (root.type === 'split') {
    return {
      ...root,
      children: root.children.map((c) => replaceTerminalNode(c, paneId, newNode)),
    };
  }
  return root;
}

export { generateSessionId };

export const usePaneStore = create<PaneState>((set, get) => ({
  roots: {},
  focusedPaneId: null,

  initRoot: (tabId) => {
    set((state) => ({
      roots: {
        ...state.roots,
        [tabId]: createTerminalNode(tabId),
      },
      focusedPaneId: state.roots[tabId]?.id || null,
    }));
  },

  split: (tabId, paneId, direction, onNew) => {
    const root = get().roots[tabId];
    if (!root) return;

    const newNode = createTerminalNode(tabId);
    const existingNode = findPane(root, paneId);
    if (!existingNode || existingNode.type === 'split') return;

    const splitNode: PaneNode = {
      type: 'split',
      id: generateId(),
      direction,
      children: [existingNode, newNode],
      sizes: [0.5, 0.5],
    };

    const newRoot = replaceTerminalNode(root, paneId, splitNode);
    set((state) => ({
      roots: { ...state.roots, [tabId]: newRoot },
      focusedPaneId: newNode.id,
    }));
    onNew(newNode);
  },

  closePane: (tabId, paneId) => {
    const root = get().roots[tabId];
    if (!root) return;

    const newRoot = removePane(root, paneId);
    if (!newRoot) return;

    set((state) => ({
      roots: { ...state.roots, [tabId]: newRoot },
      focusedPaneId: newRoot.type === 'terminal' ? newRoot.id : newRoot.children[0]?.id || null,
    }));
  },

  focusPane: (paneId) => {
    set({ focusedPaneId: paneId });
  },

  updateSizes: (tabId, splitId, sizes) => {
    const root = get().roots[tabId];
    if (!root) return;

    function updateSizesInTree(node: PaneNode): PaneNode {
      if (node.type === 'split' && node.id === splitId) {
        return { ...node, sizes };
      }
      if (node.type === 'split') {
        return { ...node, children: node.children.map(updateSizesInTree) };
      }
      return node;
    }

    set((state) => ({
      roots: { ...state.roots, [tabId]: updateSizesInTree(root) },
    }));
  },

  getRoot: (tabId) => {
    return get().roots[tabId];
  },
}));
