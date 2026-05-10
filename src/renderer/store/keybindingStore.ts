import { create } from 'zustand';
import type { Keybinding } from '../../shared/configTypes';

export type Action =
  | 'copy' | 'paste' | 'find' | 'selectAll'
  | 'newTab' | 'closeTab' | 'nextTab' | 'prevTab'
  | 'splitHorizontal' | 'splitVertical' | 'closePane'
  | 'commandPalette'
  | 'fullscreen' | 'focusMode' | 'toggleAlwaysOnTop'
  | 'openSettings' | 'newWindow'
  | 'quakeMode';

interface KeybindingState {
  bindings: Keybinding[];
  setBindings: (bindings: Keybinding[]) => void;
}

export const useKeybindingStore = create<KeybindingState>((set) => ({
  bindings: [],
  setBindings: (bindings) => set({ bindings }),
}));

// Parse a key string like "ctrl+shift+t" into a match function
export function parseKeys(keys: string): (e: KeyboardEvent) => boolean {
  const parts = keys.toLowerCase().split('+');
  const key = parts.pop() || '';

  return (e: KeyboardEvent) => {
    const keyMatch = e.key.toLowerCase() === key || e.code.toLowerCase() === `key${key}`;
    if (!keyMatch) return false;

    const ctrl = parts.includes('ctrl');
    const shift = parts.includes('shift');
    const alt = parts.includes('alt');
    const meta = parts.includes('cmd') || parts.includes('meta') || parts.includes('super');

    return (
      e.ctrlKey === ctrl &&
      e.shiftKey === shift &&
      e.altKey === alt &&
      e.metaKey === meta
    );
  };
}

export function matchAction(keys: string): { command: string; keys: string } | null {
  // Returns the action info if a given keyboard event matches any binding
  return null;
}

export function formatKeys(keys: string): string {
  const parts = keys.split('+');
  return parts
    .map((p) => {
      const map: Record<string, string> = {
        ctrl: 'Ctrl',
        shift: 'Shift',
        alt: 'Alt',
        meta: '⌘',
        cmd: '⌘',
        super: 'Super',
        tab: 'Tab',
        enter: 'Enter',
        escape: 'Esc',
        backspace: 'Bksp',
        delete: 'Del',
        arrowup: '↑',
        arrowdown: '↓',
        arrowleft: '←',
        arrowright: '→',
      };
      return map[p.toLowerCase()] || p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join('+');
}
