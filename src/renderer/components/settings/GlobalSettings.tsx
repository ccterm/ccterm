import React from 'react';
import { useConfigStore } from '../../store/configStore';

const GlobalSettings: React.FC = () => {
  const { config, updateGlobal } = useConfigStore();
  if (!config) return null;

  const g = config.global;

  return (
    <div className="settings-section">
      <h2 className="settings-heading">Global Settings</h2>

      <div className="settings-group">
        <h3>Startup</h3>
        <label className="settings-row">
          <span>Default Profile</span>
          <select
            value={g.defaultProfile}
            onChange={(e) => updateGlobal({ defaultProfile: e.target.value })}
          >
            {config.profiles.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="settings-row">
          <span>Startup Mode</span>
          <select
            value={g.startupMode}
            onChange={(e) => updateGlobal({ startupMode: e.target.value as any })}
          >
            <option value="newTab">New Tab</option>
            <option value="restore">Restore Last Session</option>
            <option value="specificProfile">Specific Profile</option>
          </select>
        </label>
        <label className="settings-row">
          <span>Center on Launch</span>
          <input
            type="checkbox"
            checked={g.centerOnLaunch}
            onChange={(e) => updateGlobal({ centerOnLaunch: e.target.checked })}
          />
        </label>
      </div>

      <div className="settings-group">
        <h3>Appearance</h3>
        <label className="settings-row">
          <span>Theme</span>
          <select
            value={g.theme}
            onChange={(e) => updateGlobal({ theme: e.target.value as any })}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">Use System</option>
          </select>
        </label>
        <label className="settings-row">
          <span>Always Show Tabs</span>
          <input
            type="checkbox"
            checked={g.alwaysShowTabs}
            onChange={(e) => updateGlobal({ alwaysShowTabs: e.target.checked })}
          />
        </label>
        <label className="settings-row">
          <span>Show Tabs in Titlebar</span>
          <input
            type="checkbox"
            checked={g.showTabsInTitlebar}
            onChange={(e) => updateGlobal({ showTabsInTitlebar: e.target.checked })}
          />
        </label>
        <label className="settings-row">
          <span>Disable Animations</span>
          <input
            type="checkbox"
            checked={g.disableAnimations}
            onChange={(e) => updateGlobal({ disableAnimations: e.target.checked })}
          />
        </label>
        <label className="settings-row">
          <span>Snap to Grid on Resize</span>
          <input
            type="checkbox"
            checked={g.snapToGridOnResize}
            onChange={(e) => updateGlobal({ snapToGridOnResize: e.target.checked })}
          />
        </label>
      </div>

      <div className="settings-group">
        <h3>Interaction</h3>
        <label className="settings-row">
          <span>Copy on Select</span>
          <input
            type="checkbox"
            checked={g.copyOnSelect}
            onChange={(e) => updateGlobal({ copyOnSelect: e.target.checked })}
          />
        </label>
        <label className="settings-row">
          <span>Multi-line Paste Warning</span>
          <input
            type="checkbox"
            checked={g.multiLinePasteWarning}
            onChange={(e) => updateGlobal({ multiLinePasteWarning: e.target.checked })}
          />
        </label>
        <label className="settings-row">
          <span>Confirm Close All Tabs</span>
          <input
            type="checkbox"
            checked={g.confirmCloseAllTabs}
            onChange={(e) => updateGlobal({ confirmCloseAllTabs: e.target.checked })}
          />
        </label>
      </div>

      <div className="settings-group">
        <h3>Language</h3>
        <label className="settings-row">
          <span>Language</span>
          <select
            value={g.language}
            onChange={(e) => updateGlobal({ language: e.target.value })}
          >
            <option value="en">English</option>
            <option value="zh-CN">简体中文</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default GlobalSettings;
