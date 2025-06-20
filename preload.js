const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ssh: {
    connect: (connectionDetails) => ipcRenderer.invoke('ssh-connect', connectionDetails),
    write: (data) => ipcRenderer.invoke('ssh-write', data),
    resize: (size) => ipcRenderer.invoke('ssh-resize', size),
    disconnect: (connectionId) => ipcRenderer.invoke('ssh-disconnect', connectionId),
    onData: (connectionId, callback) => {
      const channel = `ssh-data-${connectionId}`;
      ipcRenderer.on(channel, (event, data) => callback(data));
      // Return a function to easily remove the listener
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onClose: (connectionId, callback) => {
      const channel = `ssh-close-${connectionId}`;
      ipcRenderer.on(channel, (event, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
  }
}); 