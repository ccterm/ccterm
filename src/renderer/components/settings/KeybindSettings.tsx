import React, { useState } from 'react';
import { useConfigStore } from '../../store/configStore';
import { formatKeys } from '../../store/keybindingStore';

const ACTION_LABELS: Record<string, string> = {
  copy: 'Copy',
  paste: 'Paste',
  find: 'Find',
  selectAll: 'Select All',
  newTab: 'New Tab',
  closeTab: 'Close Tab',
  nextTab: 'Next Tab',
  prevTab: 'Previous Tab',
  splitHorizontal: 'Split Horizontally',
  splitVertical: 'Split Vertically',
  closePane: 'Close Pane',
  commandPalette: 'Command Palette',
  fullscreen: 'Toggle Fullscreen',
  focusMode: 'Toggle Focus Mode',
  toggleAlwaysOnTop: 'Toggle Always on Top',
  openSettings: 'Open Settings',
  newWindow: 'New Window',
  quakeMode: 'Quake Mode',
};

const KeybindSettings: React.FC = () => {
  const { config, updateKeybinding } = useConfigStore();
  const [recording, setRecording] = useState<{ index: number } | null>(null);

  if (!config) return null;

  const handleStartRecord = (index: number) => {
    setRecording({ index });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    if (e.metaKey) parts.push('cmd');

    // Ignore modifier-only presses
    const key = e.key.toLowerCase();
    if (['control', 'shift', 'alt', 'meta'].includes(key)) return;

    if (key === ' ') {
      parts.push('space');
    } else if (key.length === 1) {
      parts.push(key);
    } else {
      parts.push(key);
    }

    const shortcut = parts.join('+');
    updateKeybinding(index, { keys: shortcut });
    setRecording(null);
  };

  return (
    <div className="settings-section" onKeyDown={(e) => {
      if (recording) {
        handleKeyDown(e, recording.index);
      }
    }}>
      <h2 className="settings-heading">Keyboard Shortcuts</h2>
      <p className="settings-hint">Click a shortcut to change it, then press the new key combination.</p>

      <div className="settings-group">
        <div className="keybind-list">
          {config.keybindings.map((kb, i) => (
            <div key={kb.command} className="keybind-row">
              <span className="keybind-action">
                {ACTION_LABELS[kb.command] || kb.command}
              </span>
              <button
                className={`keybind-keys ${recording?.index === i ? 'recording' : ''}`}
                onClick={() => handleStartRecord(i)}
                onBlur={() => setRecording(null)}
              >
                {recording?.index === i ? 'Press keys...' : formatKeys(kb.keys)}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeybindSettings;
