'use strict';

const { app, BrowserWindow, dialog } = require('electron');

const PRODUCTION_SERVER_URL = 'https://accessible-game-lounge.onrender.com/';

let mainWindow;

function configuredServerUrl() {
  const argument = process.argv.find(value => value.startsWith('--server-url='));
  const supplied = argument?.slice('--server-url='.length) || process.env.LOUNGE_SERVER_URL;
  if (!supplied) return null;
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

async function createWindow() {
  let loungeUrl = configuredServerUrl();
  if (!loungeUrl) {
    loungeUrl = PRODUCTION_SERVER_URL;
  }

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
      sandbox: true
    }
  });
  mainWindow.setMenuBarVisibility(false);

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

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow).catch(error => {
  dialog.showErrorBox('Accessible Game Lounge could not start', error.message);
  app.quit();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => {
  if (!mainWindow) createWindow().catch(error => dialog.showErrorBox('Accessible Game Lounge could not start', error.message));
});
