import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Polyfills for simple-peer
if (typeof global === 'undefined') {
  window.global = window;
}

if (typeof process === 'undefined') {
  window.process = { env: {} };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
