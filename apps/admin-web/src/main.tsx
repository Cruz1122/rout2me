import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { LoaderProvider, useLoader } from './context/LoaderContext';
import GlobalLoader from './components/GlobalLoader';

function AppWithLoader() {
  const { isLoading } = useLoader();
  const [showLoader, setShowLoader] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsExiting(false);
      setShowLoader(true);
    } else if (showLoader) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setShowLoader(false);
        setIsExiting(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, showLoader]);

  return (
    <>
      {showLoader && <GlobalLoader isExiting={isExiting} />}
      <AppRoutes />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoaderProvider>
      <AuthProvider>
        <AppWithLoader />
      </AuthProvider>
    </LoaderProvider>
  </StrictMode>,
);
