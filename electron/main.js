// ═══ Quro — Electron Main Process ═══
const { app, BrowserWindow, ipcMain, shell, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  const icon = nativeImage.createFromPath(path.join(__dirname, '..', 'icon-512.png'));

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,              // Frameless — custom titlebar
    titleBarStyle: 'hidden',
    backgroundColor: '#080808',
    icon: icon,
    show: false,               // Show after ready-to-show
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  // Load the web app
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  // Smooth show after content loads
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
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
