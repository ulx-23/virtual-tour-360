const { app, BrowserWindow, session } = require('electron');
const path = require('node:path');
const { createTourServer } = require('./serve.cjs');
let server;
// QA only: keep the temporary browser profile inside the isolated test directory.
if (process.env.VT_DESKTOP_PROFILE) app.setPath('userData', process.env.VT_DESKTOP_PROFILE);
app.whenReady().then(() => {
  server = createTourServer(path.join(__dirname, 'tour'));
  server.listen(0, '127.0.0.1', () => {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const localSession = session.fromPartition('tour-offline');
    localSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    localSession.setPermissionCheckHandler(() => false);
    localSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
      callback({ cancel: new URL(details.url).origin !== origin });
    });
    const win = new BrowserWindow({
      width: 1280, height: 800, minWidth: 360, minHeight: 520,
      show: !process.env.VT_DESKTOP_PROFILE,
      autoHideMenuBar: true,
      webPreferences: { session: localSession, nodeIntegration: false, contextIsolation: true, sandbox: true },
    });
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', (event, url) => { if (new URL(url).origin !== origin) event.preventDefault(); });
    win.loadURL(origin);
  });
  server.on('error', (error) => { console.error(error); app.quit(); });
});
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => { if (server) server.close(); });
