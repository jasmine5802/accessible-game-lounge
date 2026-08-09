'use strict';

const path = require('path');
let electronApi;
try {
  electronApi = require('electron');
} catch {
  electronApi = null;
}

const app = electronApi?.app || null;
const BrowserWindow = electronApi?.BrowserWindow || null;
const dialog = electronApi?.dialog || null;
const ipcMain = electronApi?.ipcMain || null;

const PRODUCTION_SERVER_URL = 'https://accessible-game-lounge.onrender.com/';
const LOCAL_DEVELOPMENT_URL = 'http://127.0.0.1:3000/';

let mainWindow;
let promptModeActive = false;

if (ipcMain) {
  ipcMain.on('lounge-set-prompt-mode', (event, active) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) return;
    promptModeActive = active === true;
  });
}

function configuredServerUrl(argv = process.argv, env = process.env, isProduction = process.env.NODE_ENV === 'production') {
  const argument = argv.find(value => value.startsWith('--server-url='));
  const supplied = argument?.slice('--server-url='.length) || env.LOUNGE_SERVER_URL;
  if (supplied) {
    const parsed = new URL(supplied);
    const localDevelopment = ['localhost', '127.0.0.1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !(localDevelopment && parsed.protocol === 'http:')) {
      throw new Error('The live lounge server must use an HTTPS URL.');
    }
    parsed.pathname = '/';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  }
  if (!isProduction) return LOCAL_DEVELOPMENT_URL;
  return PRODUCTION_SERVER_URL;
}

async function createWindow() {
  if (!app || !BrowserWindow || !dialog) {
    throw new Error('Electron runtime is not available.');
  }

  const loungeUrl = configuredServerUrl(process.argv, process.env, app.isPackaged);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 760,
    minHeight: 600,
    title: "Jazzy Jay's Accessible Game Lounge",
    backgroundColor: '#071827',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (!promptModeActive || input.type !== 'keyDown' || input.control || input.alt || input.meta) return;
    const key = String(input.key || '').toLowerCase();
    if (key !== 'y' && key !== 'n') return;
    event.preventDefault();
    mainWindow.webContents.send('lounge-prompt-key', key);
  });
  mainWindow.webContents.on('did-start-navigation', () => { promptModeActive = false; });

  while (!mainWindow.isDestroyed()) {
    try {
      await mainWindow.loadURL(loungeUrl);
      break;
    } catch (_error) {
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Shared Lounge Connection Required',
        message: 'The shared Accessible Game Lounge server could not be reached.',
        detail: 'Choose Retry Connection to keep trying. Offline local rooms are disabled because players on different computers cannot see or join them.',
        buttons: ['Retry Connection', 'Quit'],
        defaultId: 0,
        cancelId: 1,
        noLink: true
      });
      if (response === 1) {
        app.quit();
        return;
      }
    }
  }

  mainWindow.on('closed', () => { promptModeActive = false; mainWindow = null; });
}

if (app && BrowserWindow && dialog) {
  app.whenReady().then(createWindow).catch(error => {
    dialog.showErrorBox('Accessible Game Lounge could not start', error.message);
    app.quit();
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('activate', () => {
    if (!mainWindow) createWindow().catch(error => dialog.showErrorBox('Accessible Game Lounge could not start', error.message));
  });
}

module.exports = { configuredServerUrl, PRODUCTION_SERVER_URL, LOCAL_DEVELOPMENT_URL };
