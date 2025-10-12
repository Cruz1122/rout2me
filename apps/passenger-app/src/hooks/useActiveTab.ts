import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useActiveTab() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    const path = location.pathname;
    switch (path) {
      case '/inicio':
        setActiveTab('inicio');
        break;
      case '/rutas':
        setActiveTab('rutas');
        break;
      case '/en-vivo':
        setActiveTab('en-vivo');
        break;
      case '/alertas':
        setActiveTab('alertas');
        break;
      case '/perfil':
        setActiveTab('perfil');
        break;
      default:
        setActiveTab('inicio');
    }
  }, [location.pathname]);

  return activeTab;
}
