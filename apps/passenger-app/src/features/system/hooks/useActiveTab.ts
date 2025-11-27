import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useActiveTab() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('inicio');

  useEffect(() => {
    const path = location.pathname || '';
    switch (path) {
      case '/inicio':
        setActiveTab('inicio');
        break;
      case '/rutas':
        setActiveTab('rutas');
        break;
      case '/buses':
        setActiveTab('buses');
        break;
      case '/alertas':
        setActiveTab('alertas');
        break;
      case '/perfil':
        setActiveTab('perfil');
        break;
      case '/':
        setActiveTab('inicio');
        break;
      default:
        // Solo establecer como activo si es una ruta de tab conocida
        if (
          path &&
          (path.startsWith('/inicio') ||
            path.startsWith('/rutas') ||
            path.startsWith('/buses') ||
            path.startsWith('/alertas') ||
            path.startsWith('/perfil'))
        ) {
          const tabName = path.split('/')[1];
          setActiveTab(tabName);
        } else {
          setActiveTab('');
        }
    }
  }, [location.pathname]);

  return activeTab;
}
