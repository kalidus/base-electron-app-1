const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Client } = require('ssh2');

// Mapa para almacenar las conexiones SSH activas (shell streams)
const sshConnections = new Map();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  mainWindow.loadFile('dist/index.html');
}

// Lógica de conexión SSH
ipcMain.handle('ssh-connect', (event, { connectionId, host, username, password }) => {
  return new Promise((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.shell((err, stream) => {
        if (err) {
          return resolve({ success: false, error: err.message });
        }
        sshConnections.set(connectionId, { conn, stream });

        stream.on('data', (data) => {
          event.sender.send(`ssh-data-${connectionId}`, data.toString('utf-8'));
        });

        stream.on('close', () => {
          event.sender.send(`ssh-close-${connectionId}`);
          sshConnections.delete(connectionId);
          conn.end();
        });

        resolve({ success: true });
      });
    }).on('error', (err) => {
      resolve({ success: false, error: err.message });
    }).connect({ host, username, password });
  });
});

ipcMain.handle('ssh-write', (event, { connectionId, data }) => {
  const connection = sshConnections.get(connectionId);
  if (connection && connection.stream) {
    connection.stream.write(data);
  }
});

ipcMain.handle('ssh-disconnect', (event, { connectionId }) => {
  const connection = sshConnections.get(connectionId);
  if (connection && connection.conn) {
    connection.conn.end();
  }
});

// Boilerplate de Electron
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Limpieza al salir
app.on('before-quit', () => {
  for (const connection of sshConnections.values()) {
    connection.conn.end();
  }
}); 