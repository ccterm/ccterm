import { app, ipcMain, dialog, BrowserWindow, shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

function getStorePath(): string {
  return path.join(app.getPath('userData'), 'workspace-folders.json');
}

let cache: string[] | null = null;

let workspaceVisible = false;

export function isWorkspaceVisible(): boolean {
  return workspaceVisible;
}

export function setWorkspaceVisible(v: boolean): void {
  workspaceVisible = v;
}

export function getWorkspaceFolders(): string[] {
  if (cache) return cache;
  try {
    const p = getStorePath();
    if (fs.existsSync(p)) {
      cache = JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch { /* ignore */ }
  if (!cache) cache = [];
  return cache;
}

function saveFolders(folders: string[]): void {
  cache = folders;
  try {
    fs.writeFileSync(getStorePath(), JSON.stringify(folders, null, 2), 'utf-8');
  } catch { /* ignore */ }
}

export function setupWorkspaceHandlers(): void {
  ipcMain.handle('workspace:getAll', () => {
    return getWorkspaceFolders();
  });

  ipcMain.handle('workspace:save', (_event, folders: string[]) => {
    saveFolders(folders);
  });

  ipcMain.handle('workspace:revealInExplorer', async (_event, folder: string) => {
    await shell.openPath(folder);
  });

  ipcMain.handle('workspace:selectFolder', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;

    const result = await dialog.showOpenDialog(win, {
      title: 'Select Workspace Folders',
      properties: ['openDirectory', 'multiSelections'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths;
    }
    return null;
  });
}
