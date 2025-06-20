const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const SSH2Promise = require('ssh2-promise');

let mainWindow;

// Store active SSH connections and their shells
const sshConnections = {};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL(
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : url.format({
          pathname: path.join(__dirname, 'dist', 'index.html'),
          protocol: 'file:',
          slashes: true
        })
  );

  // Open the DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handler to establish an SSH connection
ipcMain.on('ssh:connect', async (event, { tabId, config }) => {
  const ssh = new SSH2Promise(config);
  try {
    await ssh.connect();
    const stream = await ssh.shell({ term: 'xterm-256color' });

    sshConnections[tabId] = { ssh, stream };

    stream.on('data', (data) => {
      event.sender.send(`ssh:data:${tabId}`, data.toString('utf-8'));
    });

    stream.on('close', () => {
      event.sender.send(`ssh:data:${tabId}`, '\r\nConnection closed.\r\n');
      delete sshConnections[tabId];
    });

    event.sender.send(`ssh:ready:${tabId}`);

  } catch (err) {
    event.sender.send(`ssh:error:${tabId}`, err.message);
  }
});

// IPC handler to send data to the SSH shell
ipcMain.on('ssh:data', (event, { tabId, data }) => {
  const conn = sshConnections[tabId];
  if (conn && conn.stream) {
    conn.stream.write(data);
  }
});

// IPC handler to handle terminal resize
ipcMain.on('ssh:resize', (event, { tabId, rows, cols }) => {
    const conn = sshConnections[tabId];
    if (conn && conn.stream) {
        conn.stream.setWindow(rows, cols);
    }
});


// IPC handler to terminate an SSH connection
ipcMain.on('ssh:disconnect', (event, tabId) => {
  const conn = sshConnections[tabId];
  if (conn) {
    conn.ssh.close();
    delete sshConnections[tabId];
  }
});


// Permite cerrar la app desde el renderer (React) usando ipcRenderer
ipcMain.on('app-quit', () => {
  // Close all SSH connections before quitting
  Object.values(sshConnections).forEach(conn => {
    conn.ssh.close();
  });
  app.quit();
}); 