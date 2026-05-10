import React from 'react';
import { useConfigStore } from '../../store/configStore';

const AboutSettings: React.FC = () => {
  const { config } = useConfigStore();

  return (
    <div className="settings-section">
      <h2 className="settings-heading">About</h2>

      <div className="about-card">
        <div className="about-logo">
          <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
            <rect x="4" y="8" width="40" height="32" rx="4" stroke="#0078d4" strokeWidth="2.5" />
            <path d="M18 20l-4 4 4 4M30 20l4 4-4 4" stroke="#0078d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="about-name">Huffman Terminal</h3>
        <p className="about-version">Version 1.0.0</p>
        <p className="about-desc">
          A modern terminal emulator inspired by Windows Terminal.
          Built with Electron, React, TypeScript, and xterm.js.
        </p>

        <div className="about-info">
          <div className="about-info-row">
            <span>Electron</span>
            <span>42.0.1</span>
          </div>
          <div className="about-info-row">
            <span>Chromium</span>
            <span>132.0.6834.210</span>
          </div>
          <div className="about-info-row">
            <span>Node.js</span>
            <span>22.22.2</span>
          </div>
          <div className="about-info-row">
            <span>React</span>
            <span>18.3.1</span>
          </div>
          <div className="about-info-row">
            <span>xterm.js</span>
            <span>5.5.0</span>
          </div>
          <div className="about-info-row">
            <span>Platform</span>
            <span>{navigator.platform}</span>
          </div>
        </div>

        <div className="about-actions">
          <button className="settings-btn" onClick={() => window.configAPI.openFolder()}>
            Open Config Folder
          </button>
          <button className="settings-btn" onClick={() => window.configAPI.export()}>
            Export Settings
          </button>
          <button className="settings-btn" onClick={() => window.configAPI.import()}>
            Import Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutSettings;
