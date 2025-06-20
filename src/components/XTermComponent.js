import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

const XTermComponent = ({ host, user, password }) => {
  const terminalRef = useRef(null);
  const term = useRef(null); // Usamos ref para mantener la instancia del terminal
  const connectionId = useRef(`ssh-term-${host}-${user}-${Date.now()}`).current;

  useEffect(() => {
    if (!terminalRef.current) return;

    // Crear instancia del terminal solo una vez
    if (!term.current) {
      term.current = new Terminal({
        cursorBlink: true,
        convertEol: true,
        fontFamily: `Consolas, 'Courier New', monospace`,
        fontSize: 15,
      });

      const fitAddon = new FitAddon();
      term.current.loadAddon(fitAddon);
      term.current.open(terminalRef.current);
      fitAddon.fit();

      // Ajustar al cambiar el tamaño de la ventana
      const resizeHandler = () => fitAddon.fit();
      window.addEventListener('resize', resizeHandler);
    }
    
    const currentTerm = term.current;
    
    // Conectar a SSH
    currentTerm.write(`Connecting to ${user}@${host}...\r\n`);
    window.electron.ssh.connect({ connectionId, host, username: user, password })
      .then(result => {
        if (!result.success) {
          currentTerm.write(`\x1b[31mConnection Failed: ${result.error}\x1b[0m\r\n`);
        }
      });

    // Listener para datos entrantes del servidor
    const removeDataListener = window.electron.ssh.onData(connectionId, (data) => {
      currentTerm.write(data);
    });

    // Listener para cierre de conexión
    const removeCloseListener = window.electron.ssh.onClose(connectionId, () => {
      currentTerm.write('\r\n\x1b[31mConnection Closed\x1b[0m\r\n');
    });

    // Enviar datos tecleados por el usuario al backend
    const dataHandler = currentTerm.onData(data => {
      window.electron.ssh.write({ connectionId, data });
    });

    // Limpieza al desmontar el componente
    return () => {
      dataHandler.dispose();
      removeDataListener();
      removeCloseListener();
      window.electron.ssh.disconnect({ connectionId });
      // No destruimos el terminal aquí para que no desaparezca al cambiar de pestaña
    };
  }, [host, user, password, connectionId]); // Se re-ejecuta si cambian las props de conexión

  return <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />;
};

export default XTermComponent; 