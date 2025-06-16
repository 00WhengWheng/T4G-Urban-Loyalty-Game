// hooks/useGeolocation.ts
export const useGeolocation = () => {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation non supportata');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => setLocation([position.coords.latitude, position.coords.longitude]),
      (err) => setError(err.message)
    );
  }, []);
  
  return { location, error };
};