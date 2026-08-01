'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('loungeDesktopPromptKeys', {
  setActive(active) {
    ipcRenderer.send('lounge-set-prompt-mode', active === true);
  },
  onKey(callback) {
    if (typeof callback !== 'function') return;
    ipcRenderer.on('lounge-prompt-key', (_event, key) => callback(key));
  }
});
