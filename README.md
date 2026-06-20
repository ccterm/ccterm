# CCTerm — Claude Code Super Terminal

> The ultimate terminal emulator purpose-built for **Claude Code** and AI-assisted programming.  
> Multi-tab, multi-shell, prompt-aware, mobile-ready.

**CCTerm** 是专为 **Claude Code** 和 AI 辅助编程打造的全能终端。支持多标签并行任务、PowerShell 与 CMD 一键切换、提示词记忆管理，以及手机远程编程。

---

## 🎯 Why CCTerm? | 为什么用 CCTerm？

Claude Code is powerful, but a single terminal window quickly becomes a bottleneck when you're juggling multiple AI tasks, switching between shells, and trying to remember which prompt goes where. CCTerm is built from the ground up to solve exactly these pains.

Claude Code 很强大，但当你同时处理多个 AI 任务、在不同 Shell 间切换、还要记住各处散落的提示词时，单一终端窗口就成了效率瓶颈。CCTerm 正是为解决这些痛点而生。

| Pain Point | 痛点 | CCTerm Solution | CCTerm 方案 |
|---|---|---|---|
| Single terminal, single task | 一个终端只能跑一个任务 | **Multi-tab + split pane** — run Claude Code in multiple tabs simultaneously | 多标签 + 分屏，同时运行多个 Claude Code 实例 |
| Switching between PowerShell & CMD is tedious | 切换 PowerShell 和 CMD 很繁琐 | **One-click shell switching** — freely switch shells per tab with a single click | 每个标签页一键自由切换 Shell |
| Losing track of prompts | 提示词散落各处难以管理 | **Built-in Prompt Tool** — save, organize, and reuse your prompts | 内置提示词工具，保存、整理、复用你的提示词 |
| Can't resume yesterday's workspace | 昨天的任务环境无法恢复 | **Workspace & session persistence** — everything comes back exactly as you left it | 工作区和会话持久化，打开即恢复上次的所有终端布局 |
| Can't code from your phone | 无法用手机编程 | **Phone client + remote control** — connect to your terminal from anywhere | 手机客户端 + 远程控制，随时随地编写代码 |
| Hard to find past commands | 历史命令难以查找 | **Search overlay + history panel** — search and replay any past command instantly | 搜索覆盖层 + 历史面板，瞬间检索并重放历史命令 |

---

## ✨ Features | 核心特性

### 🤖 AI Programming | AI 编程

- **Claude Code Optimized** — Designed with Claude Code workflows as the first-class use case. Run multiple Claude Code sessions across tabs, each in its own shell environment.
- **Prompt Tool** — Built-in prompt manager. Save frequently used prompts, categorize them, and inject them into any terminal with one click. No more copy-pasting from scattered notes.
- **Command History** — Full command history with search. Every prompt you've sent to Claude Code is logged and searchable.

### 📋 Multi-Task Management | 多任务管理

- **Multi-Tab Terminal** — Create, close, switch, and drag-to-reorder tabs. Each tab runs an independent shell session. Run Claude Code in one tab, git operations in another, and a dev server in a third — all in one window.
- **Split Pane Layout** — Split the view into multiple panes side by side or stacked. Watch logs on one side while chatting with Claude Code on the other.
- **Workspace Manager** — Save your entire tab and pane layout as a named workspace. Switch between "Frontend Dev", "Backend Dev", and "Research" workspaces instantly.
- **Session Persistence** — Close CCTerm and reopen it — every tab, every pane, every command history comes back exactly as you left it.

### 🐚 Flexible Shell | 灵活 Shell

- **PowerShell ↔ CMD One-Click Switch** — Each tab can run a different shell. Switch from PowerShell to CMD (or bash, zsh, WSL) with a single click in the tab context menu.
- **Auto Shell Detection** — Automatically detects available shells on your system: PowerShell, CMD, WSL, Git Bash, bash, zsh, fish, etc.

### 📱 Mobile Programming | 手机编程

- **QR Code Session Sharing** — Generate a QR code for any terminal session. Scan it with your phone to instantly access that session remotely.
- **Phone Client App** — Dedicated mobile companion app. Run commands, view output, and interact with Claude Code from your phone.
- **Remote Relay** — Built-in relay server ensures stable remote connections even behind NAT/firewalls.

### 🎨 User Experience | 用户体验

- **Command Palette** (`Ctrl+Shift+P`) — Quick fuzzy-search access to all commands and settings.
- **Search Overlay** — Search terminal buffer content with match highlighting, perfect for finding that one error message in a sea of output.
- **Customizable Profiles** — Per-shell profiles with custom fonts, colors, cursors, and startup commands.
- **Color Schemes** — Built-in popular schemes (Dracula, Solarized, Monokai, One Dark, etc.) plus custom scheme support.
- **Fully Configurable Keybindings** — Remap any action to your preferred keyboard shortcut.
- **Cross-Platform** — Windows, macOS, and Linux are all first-class citizens.

---

## 🛠 Tech Stack | 技术栈

| Layer | Technology |
|-------|------------|
| **Framework** | Electron + React 18 + TypeScript |
| **Terminal Engine** | xterm.js 6.x |
| **PTY** | node-pty (Windows-native) |
| **Build** | Webpack 5 |
| **State Management** | Zustand |
| **Networking** | WebSocket, Express |
| **Styling** | CSS Modules |

---

## 📦 Quick Start | 快速开始

### Prerequisites | 环境要求

- **Node.js** >= 18
- **npm** >= 9
- **Windows**: Node.js native build tools
- **macOS/Linux**: `python3`, `make`, `gcc`

### Install & Run | 安装运行

```bash
# Clone | 克隆
git clone https://github.com/ccterm/ccterm.git
cd ccterm

# Install dependencies | 安装依赖
npm install

# Build & launch | 构建并启动
npm start
```

### Development Commands | 开发命令

```bash
npm start          # Build + launch | 构建并启动
npm run build      # Dev build | 开发构建
npm run build:prod # Production build | 生产构建
npm run lint       # Type-check | 类型检查
```

---

## 📁 Project Structure | 项目结构

```
ccterm/
├── src/
│   ├── main/              # Electron main process | 主进程
│   │   ├── shell.ts       # Shell / PTY management | Shell 管理
│   │   ├── session.ts     # Terminal session | 终端会话
│   │   ├── workspace.ts   # Workspace manager | 工作区管理
│   │   ├── history.ts     # Command history | 命令历史
│   │   ├── promptTool.ts  # Prompt manager | 提示词工具
│   │   ├── remoteServer.ts    # Remote control | 远程控制
│   │   └── relayClient.ts     # Relay connection | 中继连接
│   ├── renderer/          # React UI | 渲染进程
│   │   ├── components/    # UI components | 界面组件
│   │   │   ├── TabBar.tsx           # Multi-tab bar | 多标签栏
│   │   │   ├── PaneLayout.tsx       # Split pane | 分屏布局
│   │   │   ├── TerminalView.tsx     # xterm.js wrapper
│   │   │   ├── CommandPalette.tsx   # Ctrl+Shift+P
│   │   │   ├── PromptTool.tsx       # Prompt manager UI
│   │   │   ├── HistoryPanel.tsx     # Command history
│   │   │   ├── QrCodePanel.tsx      # QR code sharing
│   │   │   └── settings/            # Settings pages
│   │   ├── store/          # Zustand stores | 状态管理
│   │   └── styles/         # CSS styles
│   └── shared/            # Shared types | 共享类型
├── phone-client/          # Mobile client app | 手机客户端
├── relay-server/          # Remote relay server | 中继服务器
└── package.json
```

---

## 📄 License | 许可

MIT License

---

<p align="center"><b>CCTerm</b> — Built for Claude Code, made for AI programmers. | 专为 Claude Code 打造，献给 AI 编程者。</p>
