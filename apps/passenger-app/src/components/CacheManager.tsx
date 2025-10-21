/**
 * Componente para gestionar el sistema de caché
 * Proporciona una interfaz para ver estadísticas y controlar el caché
 */

import React, { useState, useEffect } from 'react';
import { useCache } from '../hooks/useCache';
import {
  RiRefreshLine,
  RiDeleteBinLine,
  RiSettingsLine,
  RiInformationLine,
  RiDownloadLine,
  RiDatabaseLine,
} from 'react-icons/ri';

interface CacheManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CacheManager({ isOpen, onClose }: CacheManagerProps) {
  const {
    stats,
    isLoading,
    error,
    preloadProgress,
    loadStats,
    clearCache,
    runCleanup,
    registerServiceWorker,
    updateServiceWorker,
    getServiceWorkerInfo,
    formatBytes,
  } = useCache();

  const [activeTab, setActiveTab] = useState<'stats' | 'actions' | 'settings'>(
    'stats',
  );
  const [swInfo, setSwInfo] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
      setSwInfo(getServiceWorkerInfo());
    }
  }, [isOpen, loadStats, getServiceWorkerInfo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <RiDatabaseLine className="text-blue-500" />
            Gestor de Caché
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'stats', label: 'Estadísticas', icon: RiInformationLine },
            { id: 'actions', label: 'Acciones', icon: RiSettingsLine },
            { id: 'settings', label: 'Configuración', icon: RiDownloadLine },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'stats' && (
            <div className="space-y-4">
              {isLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">
                    Cargando estadísticas...
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {stats && (
                <div className="space-y-4">
                  {/* Resumen general */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2">
                        Tamaño Total
                      </h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatBytes(stats.totalSize)}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-medium text-green-900 mb-2">
                        Elementos
                      </h3>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.totalItems}
                      </p>
                    </div>
                  </div>

                  {/* Caché de imágenes */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Caché de Imágenes
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">En memoria:</span>
                        <span className="ml-2 font-medium">
                          {stats.imageCache.memoryCacheSize}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">En disco:</span>
                        <span className="ml-2 font-medium">
                          {formatBytes(stats.imageCache.diskCacheSize)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Caché de tiles */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Caché de Tiles
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total tiles:</span>
                        <span className="ml-2 font-medium">
                          {stats.tileCache.totalTiles}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tamaño promedio:</span>
                        <span className="ml-2 font-medium">
                          {formatBytes(stats.tileCache.averageTileSize)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progreso de precarga */}
                  {preloadProgress > 0 && preloadProgress < 100 && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h3 className="font-medium text-yellow-900 mb-2">
                        Precarga en Progreso
                      </h3>
                      <div className="w-full bg-yellow-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${preloadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        {preloadProgress}% completado
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={loadStats}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RiRefreshLine size={16} />
                  Actualizar Estadísticas
                </button>

                <button
                  onClick={() => runCleanup()}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RiSettingsLine size={16} />
                  Ejecutar Limpieza Automática
                </button>

                <button
                  onClick={() => clearCache('images')}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RiDeleteBinLine size={16} />
                  Limpiar Caché de Imágenes
                </button>

                <button
                  onClick={() => clearCache('tiles')}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RiDeleteBinLine size={16} />
                  Limpiar Caché de Tiles
                </button>

                <button
                  onClick={() => clearCache('all')}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RiDeleteBinLine size={16} />
                  Limpiar Todo el Caché
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Service Worker Info */}
              {swInfo && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Service Worker
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Soportado:</span>
                      <span
                        className={`font-medium ${swInfo.isSupported ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {swInfo.isSupported ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registrado:</span>
                      <span
                        className={`font-medium ${swInfo.isRegistered ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {swInfo.isRegistered ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activo:</span>
                      <span
                        className={`font-medium ${swInfo.isActive ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {swInfo.isActive ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Worker Actions */}
              <div className="space-y-3">
                {!swInfo?.isRegistered && (
                  <button
                    onClick={registerServiceWorker}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RiDownloadLine size={16} />
                    Registrar Service Worker
                  </button>
                )}

                {swInfo?.isRegistered && (
                  <button
                    onClick={updateServiceWorker}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RiRefreshLine size={16} />
                    Actualizar Service Worker
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
