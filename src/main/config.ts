import { app, ipcMain, dialog, shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { createDefaultConfig, type AppConfig } from '../shared/configTypes';

let config: AppConfig | null = null;
let configPath: string = '';
let watcher: fs.FSWatcher | null = null;
let changeCallbacks: Array<(config: AppConfig) => void> = [];

function getConfigDir(): string {
  return path.join(app.getPath('userData'), 'config');
}

function getConfigFilePath(): string {
  return path.join(getConfigDir(), 'settings.json');
}

function ensureConfigDir(): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadConfigFromDisk(): AppConfig {
  ensureConfigDir();
  configPath = getConfigFilePath();

  if (!fs.existsSync(configPath)) {
    const defaultConfig = createDefaultConfig();
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as AppConfig;
    // Merge with defaults to fill any missing fields
    const defaults = createDefaultConfig();
    return {
      ...defaults,
      ...parsed,
      global: { ...defaults.global, ...parsed.global },
    };
  } catch {
    // If config is corrupted, return defaults
    const defaultConfig = createDefaultConfig();
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
}

function startWatcher(): void {
  try {
    watcher = fs.watch(configPath, (eventType) => {
      if (eventType === 'change') {
        try {
          const raw = fs.readFileSync(configPath, 'utf-8');
          const parsed = JSON.parse(raw) as AppConfig;
          config = parsed;
          changeCallbacks.forEach((cb) => cb(parsed));
        } catch {
          // Ignore parse errors during hot-reload
        }
      }
    });
  } catch {
    // File watching not available
  }
}

export function getConfig(): AppConfig {
  if (!config) {
    config = loadConfigFromDisk();
    startWatcher();
  }
  return config;
}

export function saveConfig(newConfig: AppConfig): void {
  config = newConfig;
  ensureConfigDir();
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
}

export function getConfigPath(): string {
  return configPath;
}

export function onConfigChange(callback: (config: AppConfig) => void): () => void {
  changeCallbacks.push(callback);
  return () => {
    changeCallbacks = changeCallbacks.filter((cb) => cb !== callback);
  };
}

export function setupConfigHandlers(): void {
  ipcMain.handle('config:get', () => {
    return getConfig();
  });

  ipcMain.handle('config:save', (_event, newConfig: AppConfig) => {
    saveConfig(newConfig);
    return true;
  });

  ipcMain.handle('config:getPath', () => {
    return getConfigPath();
  });

  ipcMain.handle('config:openFolder', async () => {
    ensureConfigDir();
    const dir = getConfigDir();
    await shell.openPath(dir);
    return dir;
  });

  // Export config (full or selective)
  ipcMain.handle('config:export', async (_event, scope?: string) => {
    const cfg = getConfig();
    let exportData: any;

    switch (scope) {
      case 'schemes':
        exportData = { version: cfg.version, schemes: cfg.schemes };
        break;
      case 'keybindings':
        exportData = { version: cfg.version, keybindings: cfg.keybindings };
        break;
      case 'profiles':
        exportData = { version: cfg.version, profiles: cfg.profiles };
        break;
      default:
        exportData = cfg;
    }

    const result = await dialog.showSaveDialog({
      defaultPath: `ccterm-${scope || 'settings'}-${Date.now()}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2), 'utf-8');
      return { success: true, path: result.filePath };
    }
    return { success: false };
  });

  // Import config
  ipcMain.handle('config:import', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      try {
        const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
        const importData = JSON.parse(raw);

        const currentConfig = getConfig();

        // Merge imported data with current config
        if (importData.schemes) {
          currentConfig.schemes = [
            ...currentConfig.schemes,
            ...importData.schemes.filter(
              (s: any) => !currentConfig.schemes.find((cs) => cs.name === s.name)
            ),
          ];
        }
        if (importData.keybindings) {
          currentConfig.keybindings = importData.keybindings;
        }
        if (importData.profiles) {
          currentConfig.profiles = importData.profiles;
        }
        if (importData.global) {
          Object.assign(currentConfig.global, importData.global);
        }

        saveConfig(currentConfig);
        return { success: true, config: currentConfig };
      } catch {
        return { success: false, error: 'Invalid JSON file' };
      }
    }
    return { success: false };
  });

  // Send config changes to all windows
  onConfigChange((newConfig) => {
    app.emit('config-changed', newConfig);
  });
}
