// ═══ Quro — Electron Main Process ═══
const { app, BrowserWindow, ipcMain, shell, nativeImage } = require('electron');
const path = require('path');

// Set app identity so Windows taskbar shows our icon, not Electron's
app.setAppUserModelId('com.quro.desktop');

let mainWindow = null;
let appIcon = null;

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'icon.ico');
  appIcon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#080808',
    icon: appIcon,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  // Load the web app
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  // Re-apply icon after show to override taskbar
  mainWindow.once('ready-to-show', () => {
    mainWindow.setIcon(appIcon);
    mainWindow.show();
    mainWindow.setIcon(appIcon);
  });

  // Keep icon persistent on focus
  mainWindow.on('focus', () => {
    mainWindow.setIcon(appIcon);
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const appUrl = `file://${path.join(__dirname, '..')}`;
    if (!url.startsWith(appUrl) && !url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ═══ IPC Handlers for window controls ═══
ipcMain.on('win:minimize', () => mainWindow?.minimize());
ipcMain.on('win:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('win:close', () => mainWindow?.close());

ipcMain.handle('win:isMaximized', () => mainWindow?.isMaximized() ?? false);

// ═══ App lifecycle ═══
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Security: restrict new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (e) => e.preventDefault());
});
