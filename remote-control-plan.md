# CCTerm 远程操控方案（含二维码 + 本地局域网测试）

## 架构概览

```
                 同一个局域网内
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌──────────────┐  HTTP (LAN IP:3001)   ┌──────────┐    │
│  │   CCTerm     │ ◄──────────────────► │  手机浏览器 │    │
│  │  (家里电脑)   │   快照/命令双向同步    │          │    │
│  │              │                       │ 扫码直接  │    │
│  │  内嵌 HTTP   │                       │ 打开页面  │    │
│  │  服务器      │                       └──────────┘    │
│  └──────────────┘                          ▲            │
│        │                                    │            │
│        ▼                                    │            │
│  ┌──────────┐                               │            │
│  │  QR 码   │ ──────── 扫描 ────────────────┘            │
│  │ (终端内) │                                           │
│  └──────────┘                                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- CCTerm 主进程内嵌一个轻量 HTTP 服务器（Express）
- 服务器提供 API + 手机端页面静态文件
- CCTerm UI 中显示一个 QR 码二维码，编码了 `http://<本机LAN IP>:3001/phone?token=xxx`
- 手机扫二维码 → 浏览器打开 → 身份验证自动完成 → 直接操控终端
- 测试期间手机和电脑在同一个局域网即可，不需要公网服务器

## 内嵌服务器

### 为什么内嵌

- 零外部依赖：不需要单独部署服务器进程
- 局域网即用：手机连同一个 WiFi，扫二维码就能操控
- 后续上公网：在已有服务器上跑同样的 Express 代码，CCTerm 连过去即可（架构不变）

### 实现

在 CCTerm main process 的 `app.whenReady()` 中启动 Express 实例：

```typescript
// src/main/remoteServer.ts
import express from 'express';
import path from 'path';

export function startRemoteServer(port: number, token: string) {
  const app = express();
  app.use(express.json());

  // 静态文件 — 手机端页面
  app.use('/phone', express.static(path.join(__dirname, '../../phone-client')));

  // API 路由（同之前设计）
  // ...

  app.listen(port, '0.0.0.0'); // 监听所有网卡，同局域网可访问
}
```

## 二维码

### 编码内容

二维码编码一个 URL：
```
http://192.168.1.105:3001/phone?token=changeme123
```

- `192.168.1.x` — 本机 LAN IP（运行时自动检测）
- `3001` — 配置的端口
- `token=xxx` — 配置的认证 token（可选，简单场景可省略）

### 手机端验证

手机打开页面时：
1. URL 上的 `token` 参数自动读入 → `localStorage` 存下
2. 后续 API 请求带 `Authorization: Bearer <token>` 头
3. 用户无感知，扫完码直接进操控界面

### QR 码在 CCTerm 中的显示

**方案：工具栏按钮 + 弹出面板**

- MenuBar 右侧加一个 QR 码图标按钮（📱 或 ▣）
- 点击后在终端上方弹出一个居中的面板，显示 QR 码图片 + URL 文字
- 面板有关闭按钮，点背景也关闭
- 面板标题："扫描二维码远程操控"

二维码生成使用 `qrcode` npm 包，渲染成 `<canvas>` 或 SVG。

```tsx
// src/renderer/components/QrCodePanel.tsx
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const QrCodePanel: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 256, margin: 1 });
    }
  }, [url]);

  return (
    <div className="qrcode-overlay" onClick={onClose}>
      <div className="qrcode-panel" onClick={e => e.stopPropagation()}>
        <h3>扫描二维码远程操控</h3>
        <canvas ref={canvasRef} />
        <p className="qrcode-url">{url}</p>
        <button onClick={onClose}>关闭</button>
      </div>
    </div>
  );
};
```

## 联调测试流程

```
1. 电脑启动 CCTerm，菜单开启 Remote Control
2. 内嵌 Express 服务器监听 0.0.0.0:3001
3. 点击工具栏 QR 码按钮 → 弹出二维码
4. 手机连接同一个 WiFi
5. 手机扫码 → 浏览器打开 http://192.168.1.x:3001/phone?token=xxx
6. 手机浏览器渲染终端画面，可以输入命令
7. 电脑终端画面同步显示手机输入的命令和执行结果
```

## API 端点（同之前，略作调整）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/phone` | 手机端 HTML 页面（静态文件） |
| `GET` | `/api/sessions` | 获取所有 Tab 列表 |
| `POST` | `/api/sessions/:id/snapshot` | CCTerm 上传终端快照 |
| `GET` | `/api/sessions/:id/snapshot` | 手机拉取最新快照 |
| `POST` | `/api/sessions/:id/commands` | 手机发送输入 `{ text, sendEnter }` |
| `GET` | `/api/sessions/:id/commands` | CCTerm 拉取待执行命令 |
| `DELETE` | `/api/sessions/:id/commands/all` | CCTerm 标记命令已执行 |
| `GET` | `/api/status` | 服务器状态、QR 码 URL |

## 手机端页面结构

```
┌─────────────────────────────────┐
│ [Tab1 ▼] [Tab2 ▼]  ...        │  ← Tab 切换器
├─────────────────────────────────┤
│                                 │
│  [终端文本渲染区域]              │  ← 等宽字体，ANSI 颜色
│                                 │
├─────────────────────────────────┤
│  [输入框________________]       │
│  [发送] [发送+回车⏎] [仅回车↵] │
└─────────────────────────────────┘
```

## 文件清单

| 文件 | 说明 |
|------|------|
| `src/main/remoteServer.ts` | **新建** — 内嵌 Express 服务器（API + 静态文件） |
| `src/main/remoteSync.ts` | **新建** — 快照采集 + 命令执行循环 |
| `src/renderer/components/QrCodePanel.tsx` | **新建** — QR 码弹窗面板 |
| `phone-client/index.html` | **新建** — 手机端页面（单文件） |
| `src/main/index.ts` | **修改** — 启动 remoteServer，QR 码菜单项 |
| `src/renderer/App.tsx` | **修改** — 集成 QrCodePanel |
| `src/renderer/components/MenuBar.tsx` | **修改** — 新增 QR 码按钮 |
| `src/renderer/components/TerminalView.tsx` | **修改** — 暴露 `getSnapshot()` |
| `src/preload/index.ts` | **修改** — 新增 RemoteAPI |
| `src/shared/configTypes.ts` | **修改** — 新增 RemoteControlConfig |
| `package.json` | **修改** — 新增 `express`, `qrcode` 依赖 |

## 配置项

```typescript
remoteControl: {
  enabled: boolean;      // 是否启用远程操控
  port: number;          // HTTP 服务器端口，默认 3001
  token: string;         // 认证 token（留空则不需要认证）
  syncInterval: number;  // 快照同步间隔 ms，默认 2000
}
```

## 实施步骤

### 阶段一：最小可用（本次实现）

1. **内嵌服务器** — `remoteServer.ts`，Express + 内存存储 + API 端点
2. **快照采集** — `remoteSync.ts`，从 TerminalView 抓 buffer → POST
3. **命令执行** — `remoteSync.ts`，GET 命令 → 写入 PTY
4. **QR 码** — `QrCodePanel.tsx`，qrcode 包生成 canvas，显示 URL
5. **手机端页面** — `phone-client/index.html`，单文件
6. **菜单/MenuBar 集成** — 开关按钮 + QR 码按钮
7. **局域网联调**

### 阶段二：完善体验

8. ANSI 颜色渲染（手机端）
9. 多 Tab 支持
10. 输入历史（localStorage）
11. 增量快照
12. Ctrl+C / Ctrl+D 等特殊按键
