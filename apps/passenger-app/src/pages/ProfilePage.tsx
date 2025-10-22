import {
  IonContent,
  IonPage,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useState } from 'react';
import { RiUser5Fill, RiDatabaseLine } from 'react-icons/ri';
import CacheManager from '../components/CacheManager';

export default function ProfilePage() {
  const [showCacheManager, setShowCacheManager] = useState(false);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1
            className="text-3xl font-bold text-center mb-12"
            style={{ color: 'var(--ion-color-dark)' }}
          >
            Perfil
          </h1>
          <div className="mb-8">
            <RiUser5Fill size={120} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-lg text-gray-600 font-medium mb-8">
            Funcionalidad en desarrollo
          </p>

          {/* Botón para abrir gestor de caché */}
          <button
            onClick={() => setShowCacheManager(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RiDatabaseLine size={20} />
            Gestionar Caché
          </button>
        </div>

        {/* Gestor de caché */}
        <CacheManager
          isOpen={showCacheManager}
          onClose={() => setShowCacheManager(false)}
        />
      </IonContent>
    </IonPage>
  );
}
