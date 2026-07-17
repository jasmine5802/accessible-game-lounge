'use strict';

const { app, BrowserWindow, dialog } = require('electron');

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
    process.env.LOUNGE_DATA_DIR = app.getPath('userData');
    const { startServer } = require('./server');
    const loungeServer = await startServer(0, '127.0.0.1');
    loungeUrl = `http://127.0.0.1:${loungeServer.address().port}/`;
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
  await mainWindow.loadURL(loungeUrl);
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
