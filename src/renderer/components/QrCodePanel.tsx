import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import '../styles/qrcode.css';

interface Props {
  url: string;
  onClose: () => void;
}

const QrCodePanel: React.FC<Props> = ({ url, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="qrcode-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="qrcode-panel" onClick={(e) => e.stopPropagation()}>
        <div className="qrcode-header">
          <h3>远程操控</h3>
          <button className="qrcode-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="qrcode-body">
          <canvas ref={canvasRef} className="qrcode-canvas" />
          <p className="qrcode-hint">手机扫描二维码即可操控终端</p>
          <div className="qrcode-url-row">
            <code className="qrcode-url">{url}</code>
            <button className="qrcode-copy-btn" onClick={handleCopy}>
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrCodePanel;
