import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { BrowserRouter } from "react-router-dom";
import { registerSW } from 'virtual:pwa-register';
import { registerServiceWorkerNotifications, clearBadge } from './lib/notificationUtils';

// Register service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload to update?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onRegistered() {
    console.log('Service Worker registered');
    registerServiceWorkerNotifications();
  },
});

// Clear badge when app is opened
if (document.hasFocus()) {
  clearBadge();
}

// Clear badge when app gains focus
window.addEventListener('focus', () => {
  clearBadge();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
