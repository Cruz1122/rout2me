import { useEffect, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonViewDidEnter,
} from '@ionic/react';
import maplibregl, { Map as MlMap } from 'maplibre-gl';

export default function HomePage() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<MlMap | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Usar OpenStreetMap (gratuito, no requiere API key)
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: {
        version: 8 as const,
        sources: {
          'osm-tiles': {
            type: 'raster' as const,
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster' as const,
            source: 'osm-tiles',
          },
        ],
      },
      center: [-75.5138, 5.0703], // LANS, Manizales
      zoom: 15,
    });

    map.on('load', () => {
      console.log('Mapa cargado correctamente');
    });

    map.on('error', (e) => {
      console.error('Error al cargar el mapa:', e);
    });

    // Controles de navegación
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      'top-right',
    );

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Hook para redimensionar el mapa cuando volvemos a esta pestaña
  useIonViewDidEnter(() => {
    if (mapInstance.current) {
      // Pequeño delay para asegurar que el DOM esté completamente renderizado
      setTimeout(() => {
        mapInstance.current?.resize();
      }, 100);
    }
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Inicio</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* fullscreen map dentro del content */}
      <IonContent fullscreen className="ion-no-padding">
        <div
          ref={mapRef}
          style={{
            width: '100vw',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1,
            touchAction: 'pan-x pan-y',
          }}
        />
      </IonContent>
    </IonPage>
  );
}
