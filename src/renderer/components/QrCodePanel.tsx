import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import '../styles/qrcode.css';

interface Props {
  url: string;
  onClose: () => void;
  relayMode?: boolean;
  relayServerUrl?: string;
  onRelayConnect?: (serverUrl: string) => void;
  relayError?: string;
}

const QrCodePanel: React.FC<Props> = ({ url, onClose, relayMode, relayServerUrl, onRelayConnect, relayError }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [serverInput, setServerInput] = useState(relayServerUrl || '');

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, { width: 240, margin: 1, color: { dark: '#cccccc', light: '#0c0c0c' } });
    }
  }, [url]);

  const handleCopy = () => {
    window.clipboardAPI.write(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const showSetup = relayMode && !url && onRelayConnect;

  return (
    <div className="qrcode-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="qrcode-panel" onClick={(e) => e.stopPropagation()}>
        <div className="qrcode-header">
          <h3>{relayMode ? '远程中转控制' : '远程操控'}</h3>
          <button className="qrcode-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="qrcode-body">
          {showSetup ? (
            <div className="qrcode-setup">
              <p className="qrcode-hint">请输入中转服务器地址</p>
              <input
                className="qrcode-input"
                type="text"
                value={serverInput}
                onChange={(e) => setServerInput(e.target.value)}
                placeholder="http://your-server.com:8080"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && serverInput.trim()) {
                    onRelayConnect(serverInput.trim());
                  }
                }}
              />
              {relayError && <p className="qrcode-error">{relayError}</p>}
              <button
                className="qrcode-connect-btn"
                disabled={!serverInput.trim()}
                onClick={() => onRelayConnect(serverInput.trim())}
              >
                连接
              </button>
            </div>
          ) : url ? (
            <>
              <canvas ref={canvasRef} className="qrcode-canvas" />
              <p className="qrcode-hint">手机扫描二维码即可操控终端</p>
              <div className="qrcode-url-row">
                <code className="qrcode-url">{url}</code>
                <button className="qrcode-copy-btn" onClick={handleCopy}>
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </>
          ) : (
            <p className="qrcode-hint">连接中...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrCodePanel;
