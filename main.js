const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const { ipcMain } = require('electron');
const { Client } = require('ssh2');

// Map para almacenar las conexiones SSH activas
const sshConnections = new Map();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
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

// Permite cerrar la app desde el renderer (React) usando ipcRenderer
ipcMain.on('app-quit', () => {
  app.quit();
});

// Handler para conectar una nueva sesión SSH
ipcMain.handle('ssh-connect', async (event, { connectionId, host, username, password }) => {
  console.log(`Attempting SSH connection to ${host} as ${username} (ID: ${connectionId})`);
  
  // Si ya existe una conexión con este ID, intentar cerrarla primero
  if (sshConnections.has(connectionId)) {
    try {
      const existingConn = sshConnections.get(connectionId);
      existingConn.end();
    } catch (err) {
      console.warn(`Error closing existing connection: ${err.message}`);
    }
    sshConnections.delete(connectionId);
  }

  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on('ready', () => {
      console.log(`SSH connection successful (ID: ${connectionId})`);
      
      // Request an interactive login shell
      conn.shell({ 
        term: 'xterm-256color',
        rows: 24,
        cols: 80,
        modes: {
          ECHO: 1,      // Local echo ON
          ICANON: 1,    // Canonical mode ON (line buffering)
          ICRNL: 1,     // Convert CR to NL on input
          IEXTEN: 1,    // Extended input processing
          ISIG: 1,      // Signal processing ON
          ONLCR: 1,     // Map NL to CR-NL on output
          IUTF8: 1,     // UTF-8 input
          OPOST: 1      // Post-process output
        }
      }, async (err, stream) => {
        if (err) {
          console.error(`Failed to create shell (ID: ${connectionId}):`, err);
          conn.end();
          resolve({ success: false, message: err.message });
          return;
        }

        // Configure stream with proper encoding
        stream.setEncoding('utf8');

        // Execute login shell to get system messages
        conn.exec('bash -l', (err, stream) => {
          if (err) {
            console.error(`Failed to start login shell (ID: ${connectionId}):`, err);
            return;
          }

          stream.on('data', (data) => {
            if (mainWindow) {
              mainWindow.webContents.send(`ssh-data-${connectionId}`, data.toString('utf8'));
            }
          });

          stream.stderr.on('data', (data) => {
            if (mainWindow) {
              mainWindow.webContents.send(`ssh-data-${connectionId}`, data.toString('utf8'));
            }
          });
        });

        // Handle regular shell data events
        stream.on('data', (data) => {
          if (mainWindow) {
            mainWindow.webContents.send(`ssh-data-${connectionId}`, data.toString('utf8'));
          }
        });

        stream.stderr.on('data', (data) => {
          if (mainWindow) {
            mainWindow.webContents.send(`ssh-data-${connectionId}`, data.toString('utf8'));
          }
        });

        stream.on('close', () => {
          console.log(`Stream closed for connection ${connectionId}`);
          if (mainWindow) {
            mainWindow.webContents.send(`ssh-close-${connectionId}`);
          }
          conn.end();
        });

        stream.on('error', (err) => {
          console.error(`Stream error for connection ${connectionId}:`, err);
          if (mainWindow) {
            mainWindow.webContents.send(`ssh-data-${connectionId}`, `\r\nError: ${err.message}\r\n`);
          }
        });

        // Store connection and stream
        sshConnections.set(connectionId, { conn, stream });
        resolve({ success: true, message: 'Conexión SSH exitosa' });
      });
    }).on('error', (err) => {
      console.error(`SSH connection failed (ID: ${connectionId}):`, err);
      sshConnections.delete(connectionId);
      resolve({ success: false, message: err.message });
    }).connect({
      host,
      username,
      password,
      readyTimeout: 20000,
      keepaliveInterval: 10000,
      keepaliveCountMax: 3,
      // Request TTY
      pty: true
    });
  });
});

// Handler para enviar datos al shell
ipcMain.handle('ssh-write', async (event, { connectionId, data }) => {
  try {
    const connection = sshConnections.get(connectionId);
    if (!connection || !connection.stream) {
      throw new Error('Shell no encontrado');
    }

    connection.stream.write(data);
    return { success: true };
  } catch (err) {
    console.error(`Write failed (ID: ${connectionId}):`, err);
    return { success: false, message: err.message };
  }
});

// Handler para redimensionar el terminal
ipcMain.handle('ssh-resize', async (event, { connectionId, rows, cols }) => {
  try {
    const connection = sshConnections.get(connectionId);
    if (!connection || !connection.stream) {
      throw new Error('Shell no encontrado');
    }

    connection.stream.setWindow(rows, cols);
    return { success: true };
  } catch (err) {
    console.error(`Resize failed (ID: ${connectionId}):`, err);
    return { success: false, message: err.message };
  }
});

// Handler para cerrar una conexión SSH
ipcMain.handle('ssh-disconnect', async (event, { connectionId }) => {
  console.log(`Disconnecting SSH (ID: ${connectionId})`);
  
  try {
    const connection = sshConnections.get(connectionId);
    if (connection) {
      if (connection.stream) {
        connection.stream.end();
      }
      connection.conn.end();
      sshConnections.delete(connectionId);
      console.log(`SSH disconnected successfully (ID: ${connectionId})`);
    }
    return { success: true };
  } catch (err) {
    console.error(`SSH disconnect failed (ID: ${connectionId}):`, err);
    sshConnections.delete(connectionId);
    return { success: false, message: err.message };
  }
});

// Limpiar todas las conexiones SSH al cerrar la aplicación
app.on('before-quit', () => {
  console.log('Cleaning up SSH connections...');
  for (const [connectionId, connection] of sshConnections.entries()) {
    try {
      if (connection.stream) {
        connection.stream.end();
      }
      connection.conn.end();
      console.log(`Closed SSH connection: ${connectionId}`);
    } catch (err) {
      console.error(`Error closing SSH connection ${connectionId}:`, err);
    }
  }
  sshConnections.clear();
}); 