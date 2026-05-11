import React from 'react';
import { useConfigStore } from '../../store/configStore';

const RemoteSettings: React.FC = () => {
  const { config, updateRemote } = useConfigStore();
  if (!config) return null;

  const rc = config.remoteControl;

  const handleChange = (patch: Partial<typeof rc>) => {
    updateRemote({ ...rc, ...patch });
  };

  return (
    <div className="settings-section">
      <h2 className="settings-heading">Remote Control</h2>

      <div className="settings-group">
        <h3>Local Network (LAN)</h3>
        <p className="settings-desc">
          Start a local HTTP server on the desktop that phones on the same network can connect to directly.
        </p>
        <label className="settings-row">
          <span>Enable LAN Server</span>
          <input
            type="checkbox"
            checked={rc.enabled}
            onChange={(e) => handleChange({ enabled: e.target.checked })}
          />
        </label>
        <label className="settings-row">
          <span>Port</span>
          <input
            type="number"
            value={rc.port}
            onChange={(e) => handleChange({ port: parseInt(e.target.value, 10) || 3001 })}
            min={1024}
            max={65535}
            style={{ width: 80 }}
          />
        </label>
        <label className="settings-row">
          <span>Token (optional)</span>
          <input
            type="text"
            value={rc.token}
            onChange={(e) => handleChange({ token: e.target.value })}
            placeholder="Leave empty for no auth"
          />
        </label>
        <label className="settings-row">
          <span>Sync Interval (ms)</span>
          <input
            type="number"
            value={rc.syncInterval}
            onChange={(e) => handleChange({ syncInterval: parseInt(e.target.value, 10) || 2000 })}
            min={500}
            max={10000}
            step={500}
            style={{ width: 80 }}
          />
        </label>
      </div>

      <div className="settings-group">
        <h3>Relay Server (Internet)</h3>
        <p className="settings-desc">
          Connect via a public relay server to control this terminal from anywhere with internet access.
          Deploy the <code>relay-server/</code> project on a cloud server first.
        </p>
        <label className="settings-row">
          <span>Enable Relay on Startup</span>
          <input
            type="checkbox"
            checked={rc.relayEnabled}
            onChange={(e) => handleChange({ relayEnabled: e.target.checked })}
          />
        </label>
        <label className="settings-row">
          <span>Relay Server URL</span>
          <input
            type="text"
            value={rc.relayServerUrl}
            onChange={(e) => handleChange({ relayServerUrl: e.target.value })}
            placeholder="http://your-server.com:8080"
          />
        </label>
        <label className="settings-row">
          <span>Relay Token (optional)</span>
          <input
            type="text"
            value={rc.relayToken}
            onChange={(e) => handleChange({ relayToken: e.target.value })}
            placeholder="Shared secret for relay auth"
          />
        </label>
      </div>
    </div>
  );
};

export default RemoteSettings;
