import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress known harmless Recharts warning that occurs when parent is hidden by CSS transitions
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('The width(') &&
    args[0].includes('and height(') &&
    args[0].includes('should be greater than 0')
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
