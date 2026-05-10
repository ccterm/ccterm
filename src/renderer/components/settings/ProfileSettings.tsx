import React from 'react';
import { useConfigStore } from '../../store/configStore';
import type { ProfileConfig } from '../../../shared/configTypes';

interface Props {
  profileIndex: number | null;
}

const defaultFonts = [
  'Cascadia Code', 'Cascadia Mono', 'Fira Code', 'JetBrains Mono',
  'Consolas', 'Courier New', 'Source Code Pro', 'Ubuntu Mono',
  'Monaco', 'Menlo', 'DejaVu Sans Mono',
];

const ProfileSettings: React.FC<Props> = ({ profileIndex }) => {
  const { config, updateProfile, addProfile } = useConfigStore();
  if (!config || profileIndex === null) {
    return (
      <div className="settings-section">
        <h2 className="settings-heading">Profiles</h2>
        <p className="settings-hint">Select a profile from the sidebar to edit its settings.</p>
        <button
          className="settings-btn"
          onClick={() => {
            const n: ProfileConfig = {
              name: 'New Profile',
              commandLine: 'bash',
              icon: '',
              startingDirectory: '~',
              colorScheme: config?.schemes[0]?.name || 'One Half Dark',
              fontFace: 'Cascadia Code',
              fontSize: 14,
              opacity: 1.0,
              backgroundImage: '',
              backgroundImageStretchMode: 'uniformToFill',
              cursorShape: 'block',
              cursorColor: '#ffffff',
              useAcrylic: false,
              bellStyle: 'audible',
              scrollbackLines: 5000,
              elevation: false,
            };
            addProfile(n);
          }}
        >
          + Add New Profile
        </button>
      </div>
    );
  }

  const profile = config.profiles[profileIndex];

  return (
    <div className="settings-section">
      <h2 className="settings-heading">{profile.name}</h2>

      <div className="settings-group">
        <h3>General</h3>
        <label className="settings-row">
          <span>Name</span>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => updateProfile(profileIndex, { name: e.target.value })}
          />
        </label>
        <label className="settings-row">
          <span>Command Line</span>
          <input
            type="text"
            value={profile.commandLine}
            onChange={(e) => updateProfile(profileIndex, { commandLine: e.target.value })}
          />
        </label>
        <label className="settings-row">
          <span>Starting Directory</span>
          <input
            type="text"
            value={profile.startingDirectory}
            onChange={(e) => updateProfile(profileIndex, { startingDirectory: e.target.value })}
          />
        </label>
        <label className="settings-row">
          <span>Icon</span>
          <input
            type="text"
            value={profile.icon}
            onChange={(e) => updateProfile(profileIndex, { icon: e.target.value })}
            placeholder="Path or emoji"
          />
        </label>
      </div>

      <div className="settings-group">
        <h3>Appearance</h3>
        <label className="settings-row">
          <span>Font Face</span>
          <select
            value={profile.fontFace}
            onChange={(e) => updateProfile(profileIndex, { fontFace: e.target.value })}
          >
            {defaultFonts.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="settings-row">
          <span>Font Size</span>
          <input
            type="number"
            min={8}
            max={72}
            value={profile.fontSize}
            onChange={(e) => updateProfile(profileIndex, { fontSize: parseInt(e.target.value) || 14 })}
          />
        </label>
        <label className="settings-row">
          <span>Color Scheme</span>
          <select
            value={profile.colorScheme}
            onChange={(e) => updateProfile(profileIndex, { colorScheme: e.target.value })}
          >
            {config.schemes.map((s) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="settings-row">
          <span>Cursor Shape</span>
          <select
            value={profile.cursorShape}
            onChange={(e) => updateProfile(profileIndex, { cursorShape: e.target.value as any })}
          >
            <option value="block">Block</option>
            <option value="underline">Underline</option>
            <option value="bar">Bar</option>
          </select>
        </label>
        <label className="settings-row">
          <span>Cursor Color</span>
          <input
            type="color"
            value={profile.cursorColor}
            onChange={(e) => updateProfile(profileIndex, { cursorColor: e.target.value })}
          />
        </label>
        <label className="settings-row">
          <span>Opacity</span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={profile.opacity}
            onChange={(e) => updateProfile(profileIndex, { opacity: parseFloat(e.target.value) })}
          />
          <span className="settings-value">{Math.round(profile.opacity * 100)}%</span>
        </label>
        <label className="settings-row">
          <span>Use Acrylic (Transparency)</span>
          <input
            type="checkbox"
            checked={profile.useAcrylic}
            onChange={(e) => updateProfile(profileIndex, { useAcrylic: e.target.checked })}
          />
        </label>
        <label className="settings-row">
          <span>Background Image Path</span>
          <input
            type="text"
            value={profile.backgroundImage}
            onChange={(e) => updateProfile(profileIndex, { backgroundImage: e.target.value })}
            placeholder="Leave empty for none"
          />
        </label>
      </div>

      <div className="settings-group">
        <h3>Advanced</h3>
        <label className="settings-row">
          <span>Bell Style</span>
          <select
            value={profile.bellStyle}
            onChange={(e) => updateProfile(profileIndex, { bellStyle: e.target.value as any })}
          >
            <option value="audible">Audible</option>
            <option value="visual">Visual</option>
            <option value="all">All</option>
            <option value="none">None</option>
          </select>
        </label>
        <label className="settings-row">
          <span>Scrollback Lines</span>
          <input
            type="number"
            min={1000}
            max={100000}
            step={1000}
            value={profile.scrollbackLines}
            onChange={(e) => updateProfile(profileIndex, { scrollbackLines: parseInt(e.target.value) || 5000 })}
          />
        </label>
      </div>
    </div>
  );
};

export default ProfileSettings;
