import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

const TerminalComponent = forwardRef(({ tabId, sshConfig, fontFamily }, ref) => {
    const terminalRef = useRef(null);
    const term = useRef(null);
    const fitAddon = useRef(null);

    // Expose fit method to parent component
    useImperativeHandle(ref, () => ({
        fit: () => {
            try {
                 fitAddon.current?.fit();
            } catch (e) {
                console.log("Failed to fit terminal", e);
            }
        }
    }));

    useEffect(() => {
        if (!tabId || !sshConfig) return;

        // Initialize Terminal
        term.current = new Terminal({
            cursorBlink: true,
            fontFamily: fontFamily,
            fontSize: 14,
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
            }
        });

        fitAddon.current = new FitAddon();
        term.current.loadAddon(fitAddon.current);

        term.current.open(terminalRef.current);
        fitAddon.current.fit();
        window.addEventListener('resize', () => fitAddon.current.fit());

        term.current.writeln('Connecting to SSH...');

        // Connect via IPC
        window.electron.ipcRenderer.send('ssh:connect', { tabId, config: sshConfig });

        // Listen for incoming data
        const dataListener = (data) => {
            term.current?.write(data);
        };
        window.electron.ipcRenderer.on(`ssh:data:${tabId}`, dataListener);

        // Listen for connection error
        const errorListener = (error) => {
            term.current?.writeln(`\r\n\x1b[31mConnection Error: ${error}\x1b[0m`);
        };
        window.electron.ipcRenderer.on(`ssh:error:${tabId}`, errorListener);

        // Handle user input
        const dataHandler = term.current.onData(data => {
            window.electron.ipcRenderer.send('ssh:data', { tabId, data });
        });

        // Handle resize
        const resizeHandler = term.current.onResize(({ cols, rows }) => {
            window.electron.ipcRenderer.send('ssh:resize', { tabId, cols, rows });
        });

        // Cleanup on component unmount
        return () => {
            window.electron.ipcRenderer.send('ssh:disconnect', tabId);
            window.electron.ipcRenderer.removeAllListeners(`ssh:data:${tabId}`);
            window.electron.ipcRenderer.removeAllListeners(`ssh:error:${tabId}`);
            dataHandler.dispose();
            resizeHandler.dispose();
            term.current?.dispose();
        };
    }, [tabId, sshConfig]);

    // Effect to update font family dynamically
    useEffect(() => {
        if (term.current && fontFamily) {
            term.current.options.fontFamily = fontFamily;
            // We might need to call fit again to readjust character sizes
            fitAddon.current?.fit();
        }
    }, [fontFamily]);

    return <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />;
});

export default TerminalComponent; 