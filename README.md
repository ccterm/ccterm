# CCTerm Super Terminal

A modern terminal emulator inspired by Windows Terminal, built with Electron, React, and TypeScript.

**CCTerm 超级终端** — 一款受 Windows Terminal 启发的现代终端模拟器，基于 Electron、React 和 TypeScript 构建。

---

## ✨ Features | 特性

- **Multi-Tab Management** — Create, close, switch, and drag-to-reorder terminal tabs.
- **Split Pane Layout** — Arrange multiple terminals side by side or stacked.
- **Command Palette** — Quick access to all commands via `Ctrl+Shift+P`.
- **Workspace Management** — Save and restore terminal layouts.
- **Search Overlay** — Search terminal buffer content with highlighting.
- **History Panel** — Browse and replay past commands.
- **QR Code Sharing** — Share terminal sessions via QR code.
- **Remote Control** — Connect and control terminals remotely.
- **Phone Client** — Companion mobile client for remote access.
- **Session Persistence** — Automatically save and restore terminal sessions.
- **Customizable Profiles** — Configure shells, fonts, colors per profile.
- **Color Schemes** — Built-in and custom color schemes.
- **Keybindings** — Fully customizable keyboard shortcuts.
- **Cross-Platform** — Works on Windows, macOS, and Linux.
- **Automatic Shell Detection** — Detects PowerShell, CMD, WSL, bash, zsh, etc.

---

| 特性 | 说明 |
|------|------|
| **多标签管理** | 创建、关闭、切换、拖拽排序终端标签 |
| **分屏布局** | 并排或堆叠排列多个终端 |
| **命令面板** | 通过 `Ctrl+Shift+P` 快速访问所有命令 |
| **工作区管理** | 保存和恢复终端布局 |
| **搜索覆盖层** | 高亮搜索终端缓冲区内容 |
| **历史面板** | 浏览和重放历史命令 |
| **二维码分享** | 通过二维码分享终端会话 |
| **远程控制** | 远程连接和控制终端 |
| **手机客户端** | 配套移动客户端，支持远程访问 |
| **会话持久化** | 自动保存和恢复终端会话 |
| **可定制配置文件** | 按配置文件配置 Shell、字体、颜色 |
| **配色方案** | 内置和自定义配色方案 |
| **快捷键** | 完全可自定义的键盘快捷键 |
| **跨平台** | 支持 Windows、macOS、Linux |
| **自动检测 Shell** | 自动检测 PowerShell、CMD、WSL、bash、zsh 等 |

---

## 🛠 Tech Stack | 技术栈

| Layer | Technology |
|-------|------------|
| **Framework** | Electron + React 18 + TypeScript |
| **Terminal Engine** | xterm.js 6.x |
| **Build** | Webpack 5 |
| **State Management** | Zustand |
| **Style** | CSS Modules |
| **IPC / Networking** | WebSocket, Express, node-pty |

---

## 📦 Quick Start | 快速开始

### Prerequisites | 环境要求

- **Node.js** >= 18
- **npm** >= 9
- **Windows**: Node.js native build tools (`windows-build-tools`)
- **macOS/Linux**: `python3`, `make`, `gcc`

### Install | 安装

```bash
# Clone the repository | 克隆仓库
git clone https://github.com/ccterm/ccterm.git
cd ccterm

# Install dependencies | 安装依赖
npm install
```

### Develop | 开发

```bash
# Build & launch | 构建并启动
npm start

# Build only (development) | 仅构建（开发模式）
npm run build

# Build for production | 生产构建
npm run build:prod

# Type-check | 类型检查
npm run lint
```

---

## 📁 Project Structure | 项目结构

```
ccterm/
├── src/
│   ├── main/              # Electron main process | 主进程
│   │   ├── index.ts       # Entry point | 入口
│   │   ├── config.ts      # Configuration management | 配置管理
│   │   ├── shell.ts       # Shell / PTY management | Shell 管理
│   │   ├── session.ts     # Terminal session | 终端会话
│   │   ├── workspace.ts   # Workspace logic | 工作区逻辑
│   │   ├── windowManager.ts
│   │   ├── remoteServer.ts    # Remote control server | 远程控制服务
│   │   ├── relayClient.ts     # Relay client | 中继客户端
│   │   ├── remoteSync.ts      # Remote session sync | 远程会话同步
│   │   ├── history.ts     # Command history | 命令历史
│   │   └── promptTool.ts  # Prompt-based tool | Prompt 工具
│   ├── preload/           # Preload scripts | 预加载脚本
│   ├── renderer/          # React UI | 渲染进程
│   │   ├── components/    # UI components | 界面组件
│   │   │   ├── TabBar.tsx
│   │   │   ├── PaneLayout.tsx
│   │   │   ├── TerminalView.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── SearchOverlay.tsx
│   │   │   ├── HistoryPanel.tsx
│   │   │   ├── WorkspacePanel.tsx
│   │   │   ├── QrCodePanel.tsx
│   │   │   ├── PromptTool.tsx
│   │   │   └── settings/     # Settings pages | 设置页面
│   │   ├── hooks/          # React hooks
│   │   ├── store/          # Zustand stores | 状态管理
│   │   └── styles/         # CSS styles | 样式
│   └── shared/            # Shared types & utils | 共享类型和工具
├── ccterm-app/            # Companion app | 配套应用
├── phone-client/          # Mobile client | 手机客户端
├── relay-server/          # Relay server | 中继服务器
├── webpack.config.ts
├── tsconfig.json
└── package.json
```

---

## 🏗 Architecture | 架构

```
┌─────────────────────────────────────────────┐
│               Electron Main Process          │
│  ┌───────────┐ ┌──────────┐ ┌────────────┐  │
│  │  Session   │ │  Shell   │ │ Workspace  │  │
│  │  Manager   │ │  (PTY)   │ │  Manager   │  │
│  └───────────┘ └──────────┘ └────────────┘  │
│  ┌───────────┐ ┌──────────┐ ┌────────────┐  │
│  │  Remote    │ │  Relay   │ │  History   │  │
│  │  Server    │ │  Client  │ │  Manager   │  │
│  └───────────┘ └──────────┘ └────────────┘  │
│         │              │                     │
│    IPC  │              │  WebSocket          │
│         ▼              ▼                     │
│  ┌──────────────────────────────────────┐    │
│  │        Electron Renderer Process       │    │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐  │    │
│  │  │  Tab   │ │  Pane  │ │ Terminal │  │    │
│  │  │  Bar   │ │ Layout │ │  View    │  │    │
│  │  └────────┘ └────────┘ └──────────┘  │    │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐  │    │
│  │  │Command │ │ Search │ │ Settings │  │    │
│  │  │Palette │ │Overlay │ │  Pages   │  │    │
│  │  └────────┘ └────────┘ └──────────┘  │    │
│  │        Zustand Store Layer             │    │
│  └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## 📄 License | 许可

MIT License

---

<p align="center">Made with ❤️ by CCTerm Team</p>
