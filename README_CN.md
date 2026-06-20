# CCTerm — Claude Code 超级终端

> 专为 **Claude Code** 和 AI 辅助编程打造的全能终端。  
> 支持多标签并行任务、PowerShell 与 CMD 一键切换、提示词记忆管理，以及手机远程编程。
>
> [English](README.md)

![CCTerm 截图](screenshot.jpg)

---

## 🎯 为什么用 CCTerm？

Claude Code 很强大，但当你同时处理多个 AI 任务、在不同 Shell 间切换、还要记住各处散落的提示词时，单一终端窗口就成了效率瓶颈。CCTerm 正是为解决这些痛点而生。

| 痛点 | CCTerm 方案 |
|---|---|
| 一个终端只能跑一个任务 | **多标签 + 分屏** — 同时运行多个 Claude Code 实例 |
| 切换 PowerShell 和 CMD 很繁琐 | **一键切换 Shell** — 每个标签页自由切换 Shell |
| 提示词散落各处难以管理 | **内置提示词工具** — 保存、整理、复用你的提示词 |
| 昨天的任务环境无法恢复 | **工作区和会话持久化** — 打开即恢复上次的所有终端布局 |
| 无法用手机编程 | **手机客户端 + 远程控制** — 随时随地编写代码 |
| 历史命令难以查找 | **搜索覆盖层 + 历史面板** — 瞬间检索并重放历史命令 |

---

## ✨ 核心特性

### 🤖 AI 编程

- **Claude Code 深度优化** — 专为 Claude Code 工作流设计。多个标签页同时运行多个 Claude Code 会话，每个标签页可使用不同的 Shell 环境。
- **提示词工具** — 内置提示词管理器。保存常用提示词、分类整理、一键注入到任意终端。告别在散落的笔记中反复复制粘贴。
- **命令历史** — 完整的可搜索命令历史。你发送给 Claude Code 的每一条提示词都会被记录，随时检索。

### 📋 多任务管理

- **多标签终端** — 创建、关闭、切换、拖拽排序标签页。每个标签页运行独立的 Shell 会话。一个标签跑 Claude Code，一个跑 git 操作，一个跑开发服务器 — 全在一个窗口里。
- **分屏布局** — 并排或堆叠分割视图为多个面板。一边看日志，一边和 Claude Code 对话。
- **工作区管理** — 将完整的标签和分屏布局保存为命名工作区。在「前端开发」「后端开发」「技术调研」之间一键切换。
- **会话持久化** — 关闭再重新打开 CCTerm，每个标签、每个分屏、每条命令历史，完完整整回到你离开时的样子。

### 🐚 灵活 Shell

- **PowerShell ↔ CMD 一键切换** — 每个标签页可运行不同的 Shell。在标签右键菜单中一键从 PowerShell 切换到 CMD（或 bash、zsh、WSL）。
- **自动检测 Shell** — 自动检测系统上可用的 Shell：PowerShell、CMD、WSL、Git Bash、bash、zsh、fish 等。

### 📱 手机编程

- **二维码会话分享** — 为任意终端会话生成二维码。用手机一扫，即可远程接入该会话。
- **手机客户端** — 专属移动端应用。在手机上执行命令、查看输出、与 Claude Code 交互。
- **远程中继** — 内置中继服务器，确保 NAT / 防火墙后也能稳定远程连接。

### 🎨 用户体验

- **命令面板**（`Ctrl+Shift+P`）— 模糊搜索，快速访问所有命令和设置。
- **搜索覆盖层** — 高亮搜索终端缓冲区内容，海量输出中瞬间定位那一条报错信息。
- **可定制配置文件** — 每个 Shell 配置独立的字体、颜色、光标样式和启动命令。
- **配色方案** — 内置流行方案（Dracula、Solarized、Monokai、One Dark 等），并支持自定义配色。
- **完全自定义快捷键** — 任意操作都可重新绑定到你习惯的快捷键。
- **跨平台** — Windows、macOS、Linux 均作为一等公民支持。

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| **框架** | Electron + React 18 + TypeScript |
| **终端引擎** | xterm.js 6.x |
| **PTY** | node-pty（Windows 原生支持） |
| **构建** | Webpack 5 |
| **状态管理** | Zustand |
| **网络通信** | WebSocket、Express |
| **样式** | CSS Modules |

---

## 📦 快速开始

### 环境要求

- **Node.js** >= 18
- **npm** >= 9
- **Windows**：需安装 Node.js 原生构建工具
- **macOS/Linux**：需安装 `python3`、`make`、`gcc`

### 安装运行

```bash
# 克隆仓库
git clone https://github.com/ccterm/ccterm.git
cd ccterm

# 安装依赖
npm install

# 构建并启动
npm start
```

### 开发命令

```bash
npm start          # 构建并启动
npm run build      # 开发构建
npm run build:prod # 生产构建
npm run lint       # 类型检查
```

---

## 📁 项目结构

```
ccterm/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── shell.ts       # Shell / PTY 管理
│   │   ├── session.ts     # 终端会话
│   │   ├── workspace.ts   # 工作区管理
│   │   ├── history.ts     # 命令历史
│   │   ├── promptTool.ts  # 提示词管理器
│   │   ├── remoteServer.ts    # 远程控制服务
│   │   └── relayClient.ts     # 中继连接
│   ├── renderer/          # React UI 渲染进程
│   │   ├── components/    # 界面组件
│   │   │   ├── TabBar.tsx           # 多标签栏
│   │   │   ├── PaneLayout.tsx       # 分屏布局
│   │   │   ├── TerminalView.tsx     # xterm.js 封装
│   │   │   ├── CommandPalette.tsx   # 命令面板
│   │   │   ├── PromptTool.tsx       # 提示词工具界面
│   │   │   ├── HistoryPanel.tsx     # 命令历史面板
│   │   │   ├── QrCodePanel.tsx      # 二维码分享
│   │   │   └── settings/            # 设置页面
│   │   ├── store/          # Zustand 状态管理
│   │   └── styles/         # CSS 样式
│   └── shared/            # 共享类型定义
├── phone-client/          # 手机客户端
├── relay-server/          # 远程中继服务器
└── package.json
```

---

## 📄 许可

MIT License

---

<p align="center"><b>CCTerm</b> — 专为 Claude Code 打造，献给 AI 编程者。</p>
