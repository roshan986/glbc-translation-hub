import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// =============================================================================
// LAYMAN EXPLANATION FOR SERVICE WORKER AUTO-REFRESH:
// When a new version is deployed to Vercel, the phone's browser downloads the new
// app code in the background. The 'controllerchange' event fires as soon as the
// new version takes over. This code automatically reloads the page once, so the
// user is immediately upgraded to the new version without ever having to manually
// clear their cache or restart their browser.
// =============================================================================
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let isRefreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!isRefreshing) {
      isRefreshing = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
