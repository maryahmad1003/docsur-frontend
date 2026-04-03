import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

serviceWorkerRegistration.register({
  onSuccess: () => console.log('[DocSecur] Mode hors ligne pret.'),
  onUpdate: () => console.log('[DocSecur] Mise a jour disponible.'),
});

reportWebVitals();
