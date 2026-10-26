import { useState, useCallback } from 'react';
import { requestLocationPermission } from '../services/permissions/permissions';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      setError('Location permission denied');
      setIsLoading(false);
      return;
    }

    // Mock geolocation response
    setTimeout(() => {
      setLocation({ latitude: 37.78825, longitude: -122.4324 });
      setIsLoading(false);
    }, 1000);
  }, []);

  return { location, error, isLoading, fetchLocation };
};
