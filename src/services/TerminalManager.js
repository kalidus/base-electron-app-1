import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

class TerminalManager {
  constructor() {
    this.connections = new Map();
  }

  createConnection({ connectionId, host, username, password }) {
    if (this.connections.has(connectionId)) {
      return this.connections.get(connectionId);
    }

    const term = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: `Consolas, 'Courier New', monospace`,
      fontSize: 15,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    const connection = {
      term,
      fitAddon,
      listeners: [],
      isOpened: false,
    };

    this.connections.set(connectionId, connection);

    // Conectar a SSH y configurar listeners
    term.write(`Connecting to ${username}@${host}...\r\n`);
    window.electron.ssh.connect({ connectionId, host, username, password })
      .then(result => {
        if (!result.success) {
          term.write(`\x1b[31mConnection Failed: ${result.error}\x1b[0m\r\n`);
        }
      });

    const removeDataListener = window.electron.ssh.onData(connectionId, (data) => {
      term.write(data);
    });
    connection.listeners.push(removeDataListener);

    const removeCloseListener = window.electron.ssh.onClose(connectionId, () => {
      term.write('\r\n\x1b[31mConnection Closed\x1b[0m\r\n');
    });
    connection.listeners.push(removeCloseListener);

    const dataHandler = term.onData(data => {
      window.electron.ssh.write({ connectionId, data });
    });
    connection.listeners.push(() => dataHandler.dispose());

    return this.connections.get(connectionId);
  }

  getConnection(connectionId) {
    return this.connections.get(connectionId);
  }

  attachTerminal(connectionId, domElement) {
    const connection = this.connections.get(connectionId);
    if (!connection || !domElement) {
      return;
    }

    if (!connection.isOpened) {
      // La primera vez, abrimos el terminal en el elemento
      connection.term.open(domElement);
      connection.isOpened = true;
    } else {
      // Las veces siguientes, solo movemos el elemento del terminal ya existente
      domElement.appendChild(connection.term.element);
    }
    
    // Siempre ajustamos y enfocamos después de adjuntar
    connection.fitAddon.fit();
    connection.term.focus();
  }

  destroyConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Limpiar todos los listeners
      connection.listeners.forEach(removeListener => removeListener());
      
      // Desconectar SSH a través del proceso principal
      window.electron.ssh.disconnect({ connectionId });
      
      // Destruir el terminal
      connection.term.dispose();
      
      // Eliminar del mapa
      this.connections.delete(connectionId);
    }
  }
}

// Exportamos una única instancia para que actúe como un singleton
const terminalManager = new TerminalManager();
export default terminalManager; 