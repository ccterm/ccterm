import React from 'react';
import { useConfigStore } from '../../store/configStore';
import type { ColorScheme } from '../../../shared/configTypes';

const COLOR_LABELS: { key: keyof ColorScheme; label: string }[] = [
  { key: 'background', label: 'Background' },
  { key: 'foreground', label: 'Foreground' },
  { key: 'cursor', label: 'Cursor' },
  { key: 'selectionBackground', label: 'Selection' },
  { key: 'black', label: 'Black' },
  { key: 'red', label: 'Red' },
  { key: 'green', label: 'Green' },
  { key: 'yellow', label: 'Yellow' },
  { key: 'blue', label: 'Blue' },
  { key: 'magenta', label: 'Magenta' },
  { key: 'cyan', label: 'Cyan' },
  { key: 'white', label: 'White' },
  { key: 'brightBlack', label: 'Bright Black' },
  { key: 'brightRed', label: 'Bright Red' },
  { key: 'brightGreen', label: 'Bright Green' },
  { key: 'brightYellow', label: 'Bright Yellow' },
  { key: 'brightBlue', label: 'Bright Blue' },
  { key: 'brightMagenta', label: 'Bright Magenta' },
  { key: 'brightCyan', label: 'Bright Cyan' },
  { key: 'brightWhite', label: 'Bright White' },
];

const SchemeSettings: React.FC = () => {
  const { config, updateScheme, addScheme } = useConfigStore();
  if (!config) return null;

  const [activeScheme, setActiveScheme] = React.useState(0);

  // Color preview component
  const ColorPreview: React.FC<{ colors: ColorScheme }> = ({ colors }) => (
    <div className="color-preview">
      <div className="color-preview-row">
        {(['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'] as const).map((k) => (
          <div key={k} className="color-swatch" style={{ backgroundColor: colors[k] }} title={k} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="settings-section">
      <h2 className="settings-heading">Color Schemes</h2>

      <div className="settings-group">
        <div className="scheme-list">
          {config.schemes.map((scheme, i) => (
            <div
              key={scheme.name}
              className={`scheme-item ${activeScheme === i ? 'active' : ''}`}
              onClick={() => setActiveScheme(i)}
            >
              <div className="scheme-item-name">{scheme.name}</div>
              <ColorPreview colors={scheme} />
            </div>
          ))}
          <button
            className="settings-btn"
            onClick={() => {
              const s: ColorScheme = {
                name: `Scheme ${config.schemes.length + 1}`,
                background: '#0c0c0c',
                foreground: '#cccccc',
                cursor: '#ffffff',
                selectionBackground: '#264f78',
                black: '#0c0c0c', red: '#c50f1f', green: '#13a10e', yellow: '#c19c00',
                blue: '#0037da', magenta: '#881798', cyan: '#3a96dd', white: '#cccccc',
                brightBlack: '#767676', brightRed: '#e74856', brightGreen: '#16c60c',
                brightYellow: '#f9f1a5', brightBlue: '#3b78ff', brightMagenta: '#b4009e',
                brightCyan: '#61d6d6', brightWhite: '#f2f2f2',
              };
              addScheme(s);
              setActiveScheme(config.schemes.length);
            }}
          >
            + New Scheme
          </button>
        </div>
      </div>

      {config.schemes[activeScheme] && (
        <div className="settings-group">
          <h3>Edit: {config.schemes[activeScheme].name}</h3>
          <div className="color-editor">
            <label className="settings-row">
              <span>Name</span>
              <input
                type="text"
                value={config.schemes[activeScheme].name}
                onChange={(e) => updateScheme(activeScheme, { name: e.target.value })}
              />
            </label>
            <div className="color-grid">
              {COLOR_LABELS.map(({ key, label }) => (
                <label key={key} className="color-field">
                  <span>{label}</span>
                  <input
                    type="color"
                    value={config.schemes[activeScheme][key]}
                    onChange={(e) => updateScheme(activeScheme, { [key]: e.target.value } as any)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemeSettings;
