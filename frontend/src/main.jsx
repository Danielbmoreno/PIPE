import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';
import { supabase } from './lib/supabase.js';
import { prepareRecoveryRoute } from './lib/recoveryCallback.js';

prepareRecoveryRoute(supabase, window.location, window.history).then(() => ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
));
