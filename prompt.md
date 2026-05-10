==============================================================================================
请依次完成以下 16 个任务，每个任务完成后输出 "===TASK_X_COMPLETED===" 并继续下一个：

## 技术选型说明
- **框架**: Electron + React + TypeScript（跨平台，兼容 Windows/Linux/macOS）
- **终端引擎**: xterm.js（成熟的 Web 终端模拟器）
- **构建工具**: Webpack + Electron Forge
- **状态管理**: Zustand
- **样式**: Tailwind CSS + CSS Modules
- **序列化/存储**: JSON Schema 驱动的配置文件系统
- **测试**: Vitest + Playwright

---

## 阶段一：基础框架与核心引擎

### 任务 1：项目脚手架与终端引擎集成
需求：搭建 Electron + React + TypeScript 项目骨架，集成 xterm.js 终端引擎，实现最基础的终端窗口。
- 初始化 Electron Forge 项目（Webpack + TypeScript 模板）
- 配置 React 渲染层
- 集成 xterm.js 并建立 IPC 通信桥（主进程 <-> 渲染进程）
- 实现终端的基本输入输出（键盘输入 -> shell -> 输出显示）
- 支持 Windows (cmd/PowerShell/WSL)、Linux/macOS 默认 shell 的自动检测与启动
- 输出："Terminal ready" 提示作为验证

### 任务 2：多 Tab 管理系统
需求：实现类似 Chrome 的多标签页管理，支持标签页的创建、关闭、切换和拖拽排序。
- TabBar 组件（标签标题、关闭按钮、图标、选中高亮）
- Tab 内容的懒加载与切换
- 拖拽排序（支持 HTML5 Drag & Drop 或使用 @dnd-kit 库）
- Tab 上下文菜单（关闭、关闭其他、关闭右侧、复制标签页）
- Tab 标题跟随终端进程标题自动更新
- 新 Tab 默认按钮（"+") 及快捷键 Ctrl+Shift+T
- 超过宽度时的滚动/折叠行为

### 任务 3：分屏系统 (Pane/Split Panes)
需求：在单个 Tab 内支持水平和垂直分割，实现多终端同时显示。
- 支持 Alt+Shift+D 水平分割、Alt+Shift+- 垂直分割
- Pane 容器组件（递归分割布局，每个子节点是一个独立终端）
- Pane 焦点切换（鼠标点击或 Alt+Shift+方向键）
- Pane 大小调整（拖拽分割线调整比例）
- Pane 关闭（右键菜单或快捷键）
- 终端实例隔离（每个 Pane 独立的 xterm.js + pty 进程）
- 布局序列化/反序列化（Session 恢复时使用）

---

## 阶段二：配置与个性化系统

### 任务 4：配置文件系统 (JSON Settings)
需求：实现类似 Windows Terminal 的 JSON 配置文件体系，支持分层配置继承。
- JSON Schema 定义（profiles.schema.json），完整的类型定义与校验规则
- 默认配置生成（首次启动自动创建默认 profiles + 配色方案）
- 配置热重载（文件变更后自动应用，无需重启）
- 配置层级：全局设置 -> Profile 默认值 -> 特定 Profile 覆盖
- 核心配置项：
  - Profiles（name, commandLine, icon, startingDirectory, colorScheme, fontFace, fontSize, opacity, backgroundImage, cursorShape, useAcrylic, bellStyle, scrollbackLines, elevation, sshConfig）
  - 全局（theme, defaultProfile, alwaysShowTabs, showTabsInTitlebar, copyOnSelect, multiLinePasteWarning, confirmCloseAllTabs, snapToGridOnResize, disableAnimations, startupMode, centerOnLaunch）
  - Keybindings（自定义快捷键映射，支持禁用默认快捷键）
  - Schemes（配色方案数组）
  - SSH Connections（host, port, user, identityFile, profile 映射）
- **启动行为配置**：newTab（默认打开新标签）、restore（恢复上次会话）、specificProfile（启动特定 Profile）
- **SSH Profile 管理**：支持在配置中定义 SSH 连接作为 Profile，连接时自动执行 ssh 命令（或使用 node-ssh 库实现原生 SSH 连接）
- **配置验证**（Schema 校验 + 错误提示 + 自动修复常见错误）
- **配置迁移**（设置版本号，大版本更新时自动迁移旧配置格式）
- 初始配置项覆盖：启动时行为、关闭按钮行为、Tab 展开行为、Titlebar 定制

### 任务 5：图形化设置界面 (Settings UI)
需求：实现类似 Windows Terminal 的设置页面，支持可视化编辑所有配置项。
- 设置页面路由（独立页面或侧边面板，通过 Ctrl+, 打开）
- 左侧导航：所有 Profiles 列表 + 全局设置 + 配色方案 + 快捷键 + 关于
- Profile 编辑页：
  - 常规（名称、图标选择器、命令行、启动目录）
  - 外观（字体、字号、光标样式、颜色主题选择、透明度滑块、背景图选择、Acrylic 开关）
  - 高级（自动换行、滚动缓冲区大小、Bell 样式）
- 全局设置页：
  - 启动（默认 Profile、启动时行为）
  - 交互（复制选择、多行粘贴警告、Tab 行为）
  - 显示（主题、Tab 位置、Titlebar 样式）
- 配色方案编辑器（前景色、背景色、光标色、16 色 ANSI 调色板可视化编辑）
- 快捷键绑定编辑器（命令搜索 + 按键录制 + 冲突检测）

### 任务 6：主题与配色系统
需求：实现完整的主题与配色管理，支持预设主题和自定义配色。
- 内置预设配色方案（如 One Half Dark/Light, Solarized, Dracula, Tango, Campbell, VS Code 等）
- 用户自定义配色方案（在 settings UI 中创建/编辑/删除）
- 应用整体主题（Light/Dark/System 三种模式）
- 配色实时预览（在设置页显示效果）
- Terminal 背景色/前景色/选择色/光标色与配色方案联动

---

## 阶段三：交互与用户体验

### 任务 7：快捷键系统
需求：实现完全可定制的键盘快捷键系统，支持全局和终端的快捷键绑定。
- 快捷键注册与管理（使用 Electron globalShortcut + 渲染进程键盘事件）
- 内置默认快捷键映射（参考 Windows Terminal 默认键位）
- 快捷键冲突检测与提示
- 支持 Chord 快捷键（组合键，如 Ctrl+Shift+P）
- 快捷键分类管理：
  - 终端操作（复制 Ctrl+Shift+C、粘贴 Ctrl+Shift+V、查找 Ctrl+Shift+F、全选 Ctrl+Shift+A）
  - Tab 操作（新 Tab、关闭、切换、移动）
  - Pane 操作（新建、关闭、焦点移动、大小调整）
  - 窗口操作（全屏 F11、专注模式 Ctrl+Shift+F11、始终置顶、打开设置、命令面板）
- **Focus Mode（专注模式）**: Ctrl+Shift+F11 切换，隐藏 Tab 栏和 Titlebar，仅显示终端内容区域
- **Always on Top（始终置顶）**: 切换窗口置顶状态，支持快捷键绑定和右键菜单触发
- **Quake Mode 快捷键**: Win+` 全局热键切换 Quake 模式（注册到 OS 级别）

### 任务 8：命令面板 (Command Palette)
需求：实现类似 VS Code 和 Windows Terminal 的命令面板，通过 Ctrl+Shift+P 唤起。
- 命令面板 UI（浮动搜索框 + 模糊匹配列表）
- 所有可执行命令注册（终端操作、Tab 操作、配置切换等）
- 支持搜索过滤（按命令名、快捷键、描述）
- 命令执行历史
- 最近使用命令置顶
- 支持通过命令切换配色方案、默认 Profile 等动态操作

### 任务 9：搜索功能 (Terminal Search)
需求：实现终端内容搜索功能，提供类似 Windows Terminal 的查找体验。
- 搜索框 UI（Ctrl+Shift+F 打开，支持搜索框在顶部或底部）
- 增量搜索（输入时实时匹配高亮）
- 大小写匹配选项
- 使用正则表达式搜索选项
- 单词全词匹配选项
- 搜索结果导航（上/下一个匹配项，匹配计数显示）
- 搜索高亮跨滚动保持
- 搜索框关闭自动清除高亮

---

## 阶段四：高级功能与完善

### 任务 10：渲染增强与视觉效果
需求：实现高性能渲染和视觉效果，包括 GPU 加速、透明度、背景图、Acrylic 效果。
- GPU 加速文本渲染（WebGL 硬件加速，xterm.js addon: webgl）
- Acrylic/透明效果（Electron BrowserWindow.setBackgroundMaterial 或 CSS backdrop-filter）
- 每 Profile 透明度独立控制（0.0 - 1.0 滑块）
- 背景图片支持（png/jpg/gif，可设填充模式：stretch/fill/cover/uniform/uniformToFill，透明度叠加）
- CRT 复古效果（扫描线滤镜，作为可选彩蛋效果）
- 光标闪烁与样式渲染（block/underline/bar，不同颜色）
- 选择区域高亮渲染

### 任务 11：会话持久化与恢复 (Session Management)
需求：实现窗口关闭时保存会话状态，重新打开时恢复所有 Tab 和 Pane。
- 会话状态序列化（包括 Tab 布局、Pane 布局、启动目录、Profile）
- 自动保存（窗口关闭/崩溃时写入 session.json）
- 启动时检测并提示恢复（或配置自动恢复）
- Tab/Pane 的独立重启（某个终端崩溃不影响其他）
- 进程管理（pty 进程的创建、监视、优雅终止）
- Shell 退出码显示与提示处理

### 任务 12：高级终端特性与国际化
需求：实现 Unicode/Emoji 渲染、链接交互、拖放集成、右键菜单、铃声通知、多语言界面。
- **Unicode 与 Emoji 渲染**: 配置合适的字体回退策略，确保 CJK 和 Emoji 正确显示
- **超链接交互**: URL 自动检测 + Ctrl+Click 打开（xterm.js addon: hyperlinks）
- **文件拖放**: 将文件/文件夹拖入终端时自动插入路径（引号包裹含空格的路径）
- **多行粘贴警告**: 检测多行粘贴内容时弹出确认对话框（可配置始终允许/拒绝）
- **鼠标模式支持**: 终端应用程序的鼠标事件转发（vim、tmux 等）
- **右键上下文菜单**:
  - 终端区域右键菜单（复制、粘贴、分割、搜索、命令面板、设置）
  - Tab 栏右键菜单（关闭、关闭其他、关闭右侧、复制标签页、重命名）
  - Titlebar 右键菜单（专注模式、始终置顶、设置、关于）
  - Pane 右键菜单（关闭 Pane、分割方向选择）
- **通知铃声 (Bell Notification)**:
  - 终端铃声事件监听
  - 视觉闪烁效果（Taskbar flash + 窗口闪烁）
  - 配置可选：audible（系统铃声）、visual（任务栏闪烁）、all（两者）、none（关闭）
- **i18n 国际化的基础架构**: react-intl 或 i18next 集成
- **内置语言**: 简体中文、英文（参考 Windows Terminal 的本地化范围）
- **语言自动检测**: 跟随系统语言自动切换，设置页支持手动覆盖

---

## 阶段五：窗口模式与多实例

### 任务 13：Quake Mode（下拉终端模式）
需求：实现 Windows Terminal 最具标志性的 Quake 模式，全局热键呼出/隐藏。
- **全局热键注册**: 使用 Electron globalShortcut 注册 Win+`（或用户自定义），即使窗口无焦点也可响应
- **Quake 窗口行为**:
  - 按下快捷键时从屏幕顶部滑入/滑出（动画过渡）
  - 窗口宽度铺满屏幕宽度（或可配置百分比）
  - 窗口高度固定为屏幕高度的 50%~60%（或可配置）
  - 窗口置顶于所有应用之上，无任务栏图标
- **焦点管理**:
  - 呼出时自动聚焦终端输入
  - 隐藏时自动失去焦点，不干扰当前应用
  - 点击其他窗口时自动隐藏（类似 Yakuake/Guake 行为）
- **多显示器支持**: 在当前有焦点的显示器上弹出 Quake 窗口
- **Quake 窗口与普通窗口隔离**: Quake 窗口拥有独立的窗口状态，不干扰主窗口的 Tab/Pane 布局
- **配置项**: 快捷键绑定、宽度比例、高度比例、动画速度开关、是否自动隐藏

### 任务 14：多窗口支持与窗口管理
需求：支持同时打开多个独立的终端窗口实例，每个窗口拥有独立的 Tab/Pane 集。
- **新窗口创建**: 支持从菜单/快捷键/Ctrl+Shift+N 打开新窗口
- **窗口间拖拽**: 支持将 Tab 在窗口间拖拽移动（拖出当前窗口创建新窗口，或拖入其他窗口合并）
- **窗口状态独立**: 每个窗口独立的配置（位置、大小、窗口状态、当前 Tab）
- **窗口标题**: 跟随当前活动 Tab 标题自动更新（或显示"Windows Terminal"）
- **Titlebar 自定义**:
  - 支持 ShowTabsInTitlebar 模式（Tab 栏和 Titlebar 合并）
  - 支持传统模式（Tab 栏在 Titlebar 下方）
  - 标题栏右键菜单
- **窗口布局快照**: 保存/恢复所有窗口的位置、大小、配置

### 任务 15：设置导入导出与应用打包
需求：实现主题/配置的导入导出功能，完成应用打包与自动更新。
- **设置导入导出**:
  - 导出当前配置为 JSON 文件（可选择仅导出主题/配色/键位/全量）
  - 从 JSON 文件导入配置（合并或覆盖模式）
  - 内置配置分享入口（"打开配置文件夹"、"在编辑器中打开"）
  - 配置备份与恢复向导
- **配置文件夹管理**:
  - 默认配置目录（%LOCALAPPDATA%/Packages/... 或 ~/.config/huffman-terminal/）
  - "打开配置文件"、"打开配置文件夹" 快捷入口
  - 日志文件（启动日志、崩溃日志，设置页可查看）
- **应用打包** (Electron Forge):
  - Windows: NSIS 或 Squirrel 安装包（支持自动更新）
  - Linux: deb/rpm/AppImage
  - macOS: dmg
- **自动更新**: electron-updater 集成，检查更新 -> 下载 -> 提示重启安装
- **关于页面**: 版本号、许可证、依赖库信息

---

## 阶段六：提示词工程 - 命令记录与管理

### 任务 16：终端命令记录与管理 (Prompt History Manager)
需求：实现终端所有输入命令/内容的自动记录，并提供可视化的管理界面，方便回顾、搜索、复用历史命令。
- **自动记录引擎**:
  - 监听终端输入，实时记录所有提交的命令/内容（非实时逐字，而是按回车提交后记录）
  - 记录元数据：命令内容、执行时间、执行目录、执行结果（exit code）、所在 Profile 类型、会话 ID
  - 支持配置记录范围：记录所有内容 / 仅记录命令 / 不记录（隐私模式）
  - 支持配置最大保留条数（默认 10000 条，自动淘汰最旧记录）
  - 隐私过滤：可配置关键词黑名单（如密码），匹配的内容自动用 `***` 替换后再记录
- **管理界面入口**:
  - 工具栏按钮（历史记录图标）或菜单项 "命令历史"
  - 快捷键 `Ctrl+Shift+H` 打开历史面板
  - 可在设置中启用/禁用该功能
- **历史管理面板 UI**:
  - 历史列表视图（分页或虚拟滚动，支持大量数据）
  - 搜索框（实时过滤，模糊匹配命令内容）
  - 筛选器：按日期范围、按 Profile、按 exit code（成功/失败）、按关键字
  - 每条记录显示：命令内容、执行时间、Profile 图标、执行目录、退出码（成功/失败标识）
  - 展开详情：完整命令、完整输出预览、执行时长、环境变量
- **历史操作**:
  - 点击命令复制到剪贴板
  - "重新执行"按钮 - 将命令填入当前活动终端并自动发送（或填入等待确认）
  - 收藏/星标重要命令（置顶显示、单独收藏夹筛选）
  - 批量删除、单条删除
  - 清空全部历史（确认对话框）
- **数据管理**:
  - 存储方案：本地 JSON 文件或 SQLite（推荐 SQLite，支持高效查询和大量数据）
  - 数据导出：导出为 JSON / CSV / TXT 格式
  - 数据导入：从导出的文件恢复历史
  - 跨会话共享：同一 Profile 的历史跨会话累积
- **增强功能**:
  - 统计面板：最常用命令 Top N、今日命令数、常用 Profile 分布
  - 命令补全建议（基于历史频率，在终端输入时提示常用命令，可选功能）
  - 只读模式：历史面板中点击命令可预览，不干扰当前终端

---

执行方式：
请严格按照顺序依次处理任务，每个任务完成后输出 "===TASK_X_COMPLETED==="，然后继续下一个。
建议每完成一个任务做一次 git commit，提交信息格式为：`feat: 完成阶段X任务X - 任务名称`
全部 16 个任务完成后最终输出 "===ALL_TASKS_DONE==="。
