import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

// Import PrimeReact styles
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

// Import custom styles
import './assets/styles.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />); 