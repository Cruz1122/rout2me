import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import Vehicles from '../pages/Vehicles';
import App from '../App';

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Example nested route to keep legacy App component if needed */}
        <Route path="/app" element={<App />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
