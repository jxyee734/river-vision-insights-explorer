
import { useState, useEffect } from 'react';

interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export const useGPS = () => {
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let watchId: number;

    const startWatching = () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
          setError(null);
        },
        (err) => {
          setError(err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    };

    startWatching();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return { location, error };
};
