import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

const XTermComponent = ({ host, user, password }) => {
  const terminalRef = useRef(null);
  const term = useRef(null);
  const fitAddon = useRef(null);
  const connectionId = useRef(`ssh-term-${host}-${user}-${Date.now()}`).current;

  // Efecto para inicializar el terminal
  useEffect(() => {
    if (terminalRef.current && !term.current) {
      term.current = new Terminal({
        cursorBlink: true,
        convertEol: true,
        fontFamily: `Consolas, 'Courier New', monospace`,
        fontSize: 15,
      });

      fitAddon.current = new FitAddon();
      term.current.loadAddon(fitAddon.current);
      term.current.open(terminalRef.current);
      fitAddon.current.fit();
    }
  }, []); // Se ejecuta solo una vez al montar

  // Efecto para ajustar el tamaño
  useEffect(() => {
    if (terminalRef.current && fitAddon.current) {
      const resizeObserver = new ResizeObserver(() => {
        fitAddon.current.fit();
      });
      resizeObserver.observe(terminalRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []); // Se ejecuta solo una vez al montar

  // Efecto para manejar la conexión SSH
  useEffect(() => {
    if (!term.current) return;

    const currentTerm = term.current;
    
    currentTerm.write(`Connecting to ${user}@${host}...\r\n`);
    window.electron.ssh.connect({ connectionId, host, username: user, password })
      .then(result => {
        if (!result.success) {
          currentTerm.write(`\x1b[31mConnection Failed: ${result.error}\x1b[0m\r\n`);
        }
      });

    const removeDataListener = window.electron.ssh.onData(connectionId, (data) => {
      currentTerm.write(data);
    });

    const removeCloseListener = window.electron.ssh.onClose(connectionId, () => {
      currentTerm.write('\r\n\x1b[31mConnection Closed\x1b[0m\r\n');
    });

    const dataHandler = currentTerm.onData(data => {
      window.electron.ssh.write({ connectionId, data });
    });

    return () => {
      dataHandler.dispose();
      removeDataListener();
      removeCloseListener();
      window.electron.ssh.disconnect({ connectionId });
    };
  }, [host, user, password, connectionId]);

  return <div ref={terminalRef} className="xterm-container" />;
};

export default XTermComponent; 