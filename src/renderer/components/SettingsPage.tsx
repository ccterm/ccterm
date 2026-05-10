import React, { useEffect, useState } from 'react';
import { useConfigStore } from '../store/configStore';
import GlobalSettings from './settings/GlobalSettings';
import ProfileSettings from './settings/ProfileSettings';
import SchemeSettings from './settings/SchemeSettings';
import KeybindSettings from './settings/KeybindSettings';
import AboutSettings from './settings/AboutSettings';
import '../styles/settings.css';

type SettingsTab = 'global' | { type: 'profile'; index: number } | 'schemes' | 'keybindings' | 'about';

interface Props {
  onClose: () => void;
}

const SettingsPage: React.FC<Props> = ({ onClose }) => {
  const { config, load, save } = useConfigStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('global');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    await save();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!config) {
    return <div className="settings-loading">Loading settings...</div>;
  }

  const renderContent = () => {
    if (activeTab === 'global') return <GlobalSettings />;
    if (activeTab === 'schemes') return <SchemeSettings />;
    if (activeTab === 'keybindings') return <KeybindSettings />;
    if (activeTab === 'about') return <AboutSettings />;
    return <ProfileSettings profileIndex={activeTab.index} />;
  };

  return (
    <div className="settings-overlay">
      <div className="settings-page">
        <div className="settings-header">
          <h1>Settings</h1>
          <div className="settings-header-actions">
            <button className="settings-btn primary" onClick={handleSave}>
              {saved ? 'Saved!' : 'Save'}
            </button>
            <button className="settings-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="settings-body">
          <div className="settings-sidebar">
            <div className="settings-sidebar-group">
              <div className="settings-sidebar-label">Global</div>
              <div
                className={`settings-nav-item ${activeTab === 'global' ? 'active' : ''}`}
                onClick={() => setActiveTab('global')}
              >
                General
              </div>
              <div
                className={`settings-nav-item ${activeTab === 'schemes' ? 'active' : ''}`}
                onClick={() => setActiveTab('schemes')}
              >
                Color Schemes
              </div>
              <div
                className={`settings-nav-item ${activeTab === 'keybindings' ? 'active' : ''}`}
                onClick={() => setActiveTab('keybindings')}
              >
                Keyboard Shortcuts
              </div>
            </div>

            <div className="settings-sidebar-group">
              <div className="settings-sidebar-label">Profiles</div>
              {config.profiles.map((p, i) => (
                <div
                  key={p.name}
                  className={`settings-nav-item ${
                    activeTab !== 'global' && activeTab !== 'schemes' && activeTab !== 'keybindings' && activeTab !== 'about' && activeTab.index === i
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => setActiveTab({ type: 'profile', index: i })}
                >
                  {p.name}
                </div>
              ))}
            </div>

            <div className="settings-sidebar-group">
              <div className="settings-sidebar-label">Other</div>
              <div
                className={`settings-nav-item ${activeTab === 'about' ? 'active' : ''}`}
                onClick={() => setActiveTab('about')}
              >
                About
              </div>
            </div>
          </div>

          <div className="settings-content">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
