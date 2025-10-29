import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { GlobalStateProvider, ToastProvider } from './AppContext.tsx';
import { SessionProvider } from './contexts/SessionContext.tsx';
import { PersistenceProvider } from './contexts/PersistenceContext.tsx';
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const AppWithProviders = () => {
  const [resetCount, setResetCount] = useState(0);
  const handleReset = () => {
    setResetCount(c => c + 1);
  };

  return (
    <ToastProvider>
      <PersistenceProvider>
        <FeatureFlagsProvider>
          <GlobalStateProvider onReset={handleReset}>
            <SessionProvider key={resetCount}>
              <App />
            </SessionProvider>
          </GlobalStateProvider>
        </FeatureFlagsProvider>
      </PersistenceProvider>
    </ToastProvider>
  );
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>
);