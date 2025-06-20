import React, { useLayoutEffect, useRef } from 'react';
import terminalManager from '../services/TerminalManager';

const XTermComponent = ({ connectionId, isActive }) => {
  const terminalRef = useRef(null);

  useLayoutEffect(() => {
    if (!terminalRef.current || !connectionId) return;

    // Solo actuamos si la pestaña está activa para evitar trabajo innecesario
    if (isActive) {
      // Usamos requestAnimationFrame para asegurar que el DOM está listo
      const animationFrameId = requestAnimationFrame(() => {
        if (terminalRef.current) {
          terminalManager.attachTerminal(connectionId, terminalRef.current);
        }
      });

      const fitTerminal = () => {
        const connection = terminalManager.getConnection(connectionId);
        if (connection) {
          try {
            connection.fitAddon.fit();
          } catch (e) { /* Ignorar errores si el terminal se desmonta rápidamente */ }
        }
      };

      const resizeObserver = new ResizeObserver(fitTerminal);
      resizeObserver.observe(terminalRef.current);

      return () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        
        // Al desmontar, DESACOPLAMOS el elemento del terminal, NO lo destruimos.
        const connection = terminalManager.getConnection(connectionId);
        if (terminalRef.current && connection?.term.element) {
          if (terminalRef.current.contains(connection.term.element)) {
            try {
              terminalRef.current.removeChild(connection.term.element);
            } catch (e) { /* Ignorar si ya fue removido */ }
          }
        }
      };
    }
  }, [connectionId, isActive]);

  // Efecto para enfocar el terminal cuando la pestaña está activa
  useLayoutEffect(() => {
    if (isActive && terminalManager.getConnection(connectionId)) {
      const connection = terminalManager.getConnection(connectionId);
      // Retraso para asegurar que el DOM esté visible
      setTimeout(() => {
        connection.term.focus();
        connection.fitAddon.fit(); // Reajustar por si acaso
      }, 50); 
    }
  }, [isActive, connectionId]);

  return <div ref={terminalRef} className="xterm-container" />;
};

export default XTermComponent; 