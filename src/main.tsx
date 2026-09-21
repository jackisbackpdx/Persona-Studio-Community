import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent noisy unhandled error notifications from benign browser ResizeObserver cycle limits
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (
      e.message &&
      (e.message.includes('ResizeObserver loop') ||
        e.message.includes('ResizeObserver loop completed with undelivered notifications') ||
        e.message.includes('ResizeObserver loop limit exceeded'))
    ) {
      e.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
