export interface ProfileConfig {
  name: string;
  commandLine: string;
  icon: string;
  startingDirectory: string;
  colorScheme: string;
  fontFace: string;
  fontSize: number;
  opacity: number;
  backgroundImage: string;
  backgroundImageStretchMode: 'none' | 'fill' | 'uniform' | 'uniformToFill';
  cursorShape: 'block' | 'underline' | 'bar';
  cursorColor: string;
  useAcrylic: boolean;
  bellStyle: 'audible' | 'visual' | 'all' | 'none';
  scrollbackLines: number;
  elevation: boolean;
  sshConfig?: {
    host: string;
    port: number;
    user: string;
    identityFile: string;
  };
}

export interface ColorScheme {
  name: string;
  background: string;
  foreground: string;
  cursor: string;
  selectionBackground: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface Keybinding {
  command: string;
  keys: string;
}

export interface SSHConnection {
  name: string;
  host: string;
  port: number;
  user: string;
  identityFile?: string;
  profileName?: string;
}

export type StartupMode = 'newTab' | 'restore' | 'specificProfile';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface GlobalSettings {
  theme: ThemeMode;
  defaultProfile: string;
  alwaysShowTabs: boolean;
  showTabsInTitlebar: boolean;
  copyOnSelect: boolean;
  multiLinePasteWarning: boolean;
  confirmCloseAllTabs: boolean;
  snapToGridOnResize: boolean;
  disableAnimations: boolean;
  startupMode: StartupMode;
  centerOnLaunch: boolean;
  language: string;
  initialRows: number;
  initialCols: number;
}

export interface RemoteControlConfig {
  enabled: boolean;
  port: number;
  token: string;
  syncInterval: number;
}

export interface AppConfig {
  version: number;
  global: GlobalSettings;
  profiles: ProfileConfig[];
  schemes: ColorScheme[];
  keybindings: Keybinding[];
  sshConnections: SSHConnection[];
  remoteControl: RemoteControlConfig;
}

export const DEFAULT_COLOR_SCHEMES: ColorScheme[] = [
  {
    name: 'One Half Dark',
    background: '#282c34',
    foreground: '#dcdfe4',
    cursor: '#dcdfe4',
    selectionBackground: '#474e5d',
    black: '#282c34',
    red: '#e06c75',
    green: '#98c379',
    yellow: '#e5c07b',
    blue: '#61afef',
    magenta: '#c678dd',
    cyan: '#56b6c2',
    white: '#dcdfe4',
    brightBlack: '#5c6370',
    brightRed: '#e06c75',
    brightGreen: '#98c379',
    brightYellow: '#e5c07b',
    brightBlue: '#61afef',
    brightMagenta: '#c678dd',
    brightCyan: '#56b6c2',
    brightWhite: '#ffffff',
  },
  {
    name: 'One Half Light',
    background: '#fafafa',
    foreground: '#383a42',
    cursor: '#383a42',
    selectionBackground: '#e5e5e5',
    black: '#383a42',
    red: '#e45649',
    green: '#50a14f',
    yellow: '#c18401',
    blue: '#0184bc',
    magenta: '#a626a4',
    cyan: '#0997b3',
    white: '#fafafa',
    brightBlack: '#4f525e',
    brightRed: '#e45649',
    brightGreen: '#50a14f',
    brightYellow: '#c18401',
    brightBlue: '#0184bc',
    brightMagenta: '#a626a4',
    brightCyan: '#0997b3',
    brightWhite: '#ffffff',
  },
  {
    name: 'Solarized Dark',
    background: '#002b36',
    foreground: '#839496',
    cursor: '#839496',
    selectionBackground: '#073642',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#002b36',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3',
  },
  {
    name: 'Dracula',
    background: '#282a36',
    foreground: '#f8f8f2',
    cursor: '#f8f8f2',
    selectionBackground: '#44475a',
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#6272a4',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff',
  },
  {
    name: 'Campbell',
    background: '#0c0c0c',
    foreground: '#cccccc',
    cursor: '#ffffff',
    selectionBackground: '#264f78',
    black: '#0c0c0c',
    red: '#c50f1f',
    green: '#13a10e',
    yellow: '#c19c00',
    blue: '#0037da',
    magenta: '#881798',
    cyan: '#3a96dd',
    white: '#cccccc',
    brightBlack: '#767676',
    brightRed: '#e74856',
    brightGreen: '#16c60c',
    brightYellow: '#f9f1a5',
    brightBlue: '#3b78ff',
    brightMagenta: '#b4009e',
    brightCyan: '#61d6d6',
    brightWhite: '#f2f2f2',
  },
  {
    name: 'Tango Dark',
    background: '#000000',
    foreground: '#d3d7cf',
    cursor: '#ffffff',
    selectionBackground: '#4a4a4a',
    black: '#000000',
    red: '#cc0000',
    green: '#4e9a06',
    yellow: '#c4a000',
    blue: '#3465a4',
    magenta: '#75507b',
    cyan: '#06989a',
    white: '#d3d7cf',
    brightBlack: '#555753',
    brightRed: '#ef2929',
    brightGreen: '#8ae234',
    brightYellow: '#fce94f',
    brightBlue: '#729fcf',
    brightMagenta: '#ad7fa8',
    brightCyan: '#34e2e2',
    brightWhite: '#eeeeee',
  },
];

export const DEFAULT_PROFILES: ProfileConfig[] = [
  {
    name: 'PowerShell',
    commandLine: 'powershell.exe',
    icon: '',
    startingDirectory: '%USERPROFILE%',
    colorScheme: 'One Half Dark',
    fontFace: 'Consolas',
    fontSize: 14,
    opacity: 1.0,
    backgroundImage: '',
    backgroundImageStretchMode: 'uniformToFill',
    cursorShape: 'block',
    cursorColor: '#ffffff',
    useAcrylic: false,
    bellStyle: 'audible',
    scrollbackLines: 5000,
    elevation: false,
  },
  {
    name: 'Command Prompt',
    commandLine: 'cmd.exe',
    icon: '',
    startingDirectory: '%USERPROFILE%',
    colorScheme: 'Campbell',
    fontFace: 'Consolas',
    fontSize: 14,
    opacity: 1.0,
    backgroundImage: '',
    backgroundImageStretchMode: 'uniformToFill',
    cursorShape: 'block',
    cursorColor: '#ffffff',
    useAcrylic: false,
    bellStyle: 'audible',
    scrollbackLines: 5000,
    elevation: false,
  },
];

export const DEFAULT_KEYBINDINGS: Keybinding[] = [
  { command: 'copy', keys: 'ctrl+shift+c' },
  { command: 'paste', keys: 'ctrl+shift+v' },
  { command: 'find', keys: 'ctrl+shift+f' },
  { command: 'newTab', keys: 'ctrl+shift+t' },
  { command: 'closeTab', keys: 'ctrl+shift+w' },
  { command: 'nextTab', keys: 'ctrl+tab' },
  { command: 'prevTab', keys: 'ctrl+shift+tab' },
  { command: 'commandPalette', keys: 'ctrl+shift+p' },
  { command: 'splitHorizontal', keys: 'alt+shift+d' },
  { command: 'splitVertical', keys: 'alt+shift+-' },
  { command: 'fullscreen', keys: 'f11' },
  { command: 'focusMode', keys: 'ctrl+shift+f11' },
  { command: 'openSettings', keys: 'ctrl+,' },
  { command: 'newWindow', keys: 'ctrl+shift+n' },
];

export function createDefaultConfig(): AppConfig {
  return {
    version: 1,
    global: {
      theme: 'dark',
      defaultProfile: 'PowerShell',
      alwaysShowTabs: true,
      showTabsInTitlebar: true,
      copyOnSelect: false,
      multiLinePasteWarning: true,
      confirmCloseAllTabs: false,
      snapToGridOnResize: false,
      disableAnimations: false,
      startupMode: 'newTab',
      centerOnLaunch: true,
      language: 'en',
      initialRows: 30,
      initialCols: 120,
    },
    profiles: DEFAULT_PROFILES,
    schemes: DEFAULT_COLOR_SCHEMES,
    keybindings: DEFAULT_KEYBINDINGS,
    sshConnections: [],
    remoteControl: {
      enabled: false,
      port: 3001,
      token: '',
      syncInterval: 2000,
    },
  };
}
