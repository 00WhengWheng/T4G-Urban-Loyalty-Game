import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Zap, 
  MapPin, 
  Check, 
  X, 
  RefreshCw,
  Smartphone,
  Target,
  Award,
  Clock,
  Navigation,
  AlertTriangle,
  Wifi,
  WifiOff,
  Camera,
  CameraOff
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';

// Mock scan results
const mockScanResults = {
  success: {
    tag_identifier: 'T4G_BAR_CENTRAL_001',
    tenant: {
      business_name: 'Bar Central',
      address: 'Via Roma 123, Centro',
      logo_url: null
    },
    points_earned: 15,
    scan_id: 'scan_' + Date.now(),
    message: 'Hai guadagnato 15 punti!',
    daily_scans: 2,
    max_daily_scans: 5
  },
  error: {
    message: 'Tag NFC non valido o scaduto',
    reason: 'invalid_tag'
  },
  rate_limit: {
    message: 'Hai già scansionato questo tag oggi',
    reason: 'daily_limit_exceeded',
    next_scan_available: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  distance_error: {
    message: 'Sei troppo lontano dal commerciante',
    reason: 'distance_too_far',
    required_distance: 100,
    current_distance: 250
  }
};

export const ScanPage: React.FC = () => {
  const { user, updateUserPoints } = useAuthStore();
  const navigate = useNavigate();
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'processing' | 'success' | 'error'>('idle');
  const [scanResult, setScanResult] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [isNFCSupported, setIsNFCSupported] = useState(true);
  const [scanHistory, setScanHistory] = useState([
    { id: '1', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), points: 10, business: 'Pizzeria Roma' },
    { id: '2', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), points: 15, business: 'Bar Central' },
    { id: '3', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), points: 20, business: 'Gelateria Luna' }
  ]);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
    getUserLocation();
  }, []);

  const checkPermissions = async () => {
    // Check camera permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission('granted');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setCameraPermission('denied');
    }

    // Check NFC support
    if (!('NDEFReader' in window)) {
      setIsNFCSupported(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationPermission('granted');
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationPermission('denied');
        }
      );
    } else {
      setLocationPermission('denied');
    }
  };

  const startNFCScan = async () => {
    if (!isNFCSupported) {
      toast.error('NFC non supportato su questo dispositivo');
      return;
    }

    setScanState('scanning');

    try {
      // Simulate NFC scan with random result
      setTimeout(() => {
        setScanState('processing');
        
        setTimeout(() => {
          const outcomes = ['success', 'error', 'rate_limit', 'distance_error'];
          const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
          
          handleScanResult(randomOutcome);
        }, 1500);
      }, 2000);

    } catch (error) {
      console.error('NFC scan error:', error);
      setScanState('error');
      setScanResult({ message: 'Errore durante la scansione NFC' });
    }
  };

  const startQRScan = async () => {
    if (cameraPermission !== 'granted') {
      toast.error('Permesso camera necessario per scansionare QR Code');
      return;
    }

    setScanState('scanning');

    // Simulate QR scan
    setTimeout(() => {
      setScanState('processing');
      
      setTimeout(() => {
        handleScanResult('success');
      }, 1500);
    }, 3000);
  };

  const handleScanResult = (resultType: string) => {
    const result = mockScanResults[resultType as keyof typeof mockScanResults];
    setScanResult(result);

    if (resultType === 'success' && 'points_earned' in result) {
      setScanState('success');
      updateUserPoints(result.points_earned);
      
      // Add to scan history
      setScanHistory(prev => [{
        id: result.scan_id,
        timestamp: new Date(),
        points: result.points_earned,
        business: result.tenant.business_name
      }, ...prev]);

      // Auto-reset after delay
      setTimeout(() => {
        resetScan();
      }, 4000);
    } else {
      setScanState('error');
      
      // Auto-reset after delay
      setTimeout(() => {
        resetScan();
      }, 3000);
    }
  };

  const resetScan = () => {
    setScanState('idle');
    setScanResult(null);
  };

  const renderScanInterface = () => {
    switch (scanState) {
      case 'scanning':
        return (
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Target className="w-16 h-16 text-primary-600" />
              </motion.div>
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Scansione in corso...</h3>
            <p className="text-gray-600">Avvicina il dispositivo al tag NFC</p>
            <Button onClick={resetScan} variant="outline" className="mt-4">
              Annulla
            </Button>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <RefreshCw className="w-16 h-16 text-primary-600" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Elaborazione...</h3>
            <p className="text-gray-600">Stiamo verificando il tag</p>
          </div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-12 h-12 text-green-600" />
            </motion.div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">
              +{scanResult?.points_earned} Punti!
            </h3>
            <p className="text-gray-900 font-medium mb-1">{scanResult?.tenant?.business_name}</p>
            <p className="text-gray-600 mb-4">{scanResult?.message}</p>
            
            {scanResult?.daily_scans && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  Scansioni oggi: {scanResult.daily_scans}/{scanResult.max_daily_scans}
                </p>
              </div>
            )}
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="w-12 h-12 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-red-600 mb-2">Scansione Fallita</h3>
            <p className="text-gray-600 mb-4">{scanResult?.message}</p>
            
            {scanResult?.reason === 'distance_too_far' && (
              <div className="bg-orange-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-orange-800">
                  Distanza attuale: {scanResult.current_distance}m<br/>
                  Distanza richiesta: entro {scanResult.required_distance}m
                </p>
              </div>
            )}
            
            {scanResult?.reason === 'daily_limit_exceeded' && (
              <div className="bg-yellow-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  Prossima scansione disponibile:<br/>
                  {scanResult.next_scan_available?.toLocaleString()}
                </p>
              </div>
            )}
            
            <Button onClick={resetScan} className="mt-2">
              Riprova
            </Button>
          </motion.div>
        );

      default:
        return (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <QrCode className="w-16 h-16 text-gray-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Pronto per la scansione</h3>
              <p className="text-gray-600">Scegli il metodo di scansione</p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={startNFCScan}
                disabled={!isNFCSupported}
                className="w-full"
              >
                <Zap className="w-5 h-5 mr-2" />
                Scansiona Tag NFC
              </Button>
              
              <Button 
                onClick={startQRScan}
                variant="outline"
                disabled={cameraPermission !== 'granted'}
                className="w-full"
              >
                <QrCode className="w-5 h-5 mr-2" />
                Scansiona QR Code
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Scanner T4G</h1>
        <p className="text-gray-600">Scansiona tag NFC o QR Code per guadagnare punti</p>
      </div>

      {/* User Points */}
      <Card className="text-center p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-center space-x-2 mb-1">
          <Award className="w-5 h-5" />
          <span className="text-2xl font-bold">{user?.total_points?.toLocaleString() || '0'}</span>
        </div>
        <p className="text-primary-100 text-sm">Punti Totali</p>
      </Card>

      {/* Permission Status */}
      <Card className="p-4">
        <h3 className="font-medium text-gray-900 mb-3">Status Permessi</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              {locationPermission === 'granted' ? <MapPin className="w-4 h-4 text-green-500" /> : <MapPin className="w-4 h-4 text-red-500" />}
              <span>Posizione</span>
            </div>
            <Badge variant={locationPermission === 'granted' ? 'success' : 'error'} size="sm">
              {locationPermission === 'granted' ? 'Attivo' : 'Richiesto'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              {cameraPermission === 'granted' ? <Camera className="w-4 h-4 text-green-500" /> : <CameraOff className="w-4 h-4 text-red-500" />}
              <span>Camera</span>
            </div>
            <Badge variant={cameraPermission === 'granted' ? 'success' : 'error'} size="sm">
              {cameraPermission === 'granted' ? 'Attivo' : 'Richiesto'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              {isNFCSupported ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
              <span>NFC</span>
            </div>
            <Badge variant={isNFCSupported ? 'success' : 'error'} size="sm">
              {isNFCSupported ? 'Supportato' : 'Non disponibile'}
            </Badge>
          </div>
        </div>
        
        {(locationPermission !== 'granted' || cameraPermission !== 'granted') && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Permessi richiesti</p>
                <p>Abilita i permessi per utilizzare tutte le funzionalità</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Main Scan Interface */}
      <Card className="p-8">
        <AnimatePresence mode="wait">
          {renderScanInterface()}
        </AnimatePresence>
      </Card>

      {/* Instructions */}
      <Card className="p-4">
        <h3 className="font-medium text-gray-900 mb-3">Come funziona</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary-600 text-xs font-bold">1</span>
            </div>
            <p>Visita un commerciante partner T4G</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary-600 text-xs font-bold">2</span>
            </div>
            <p>Scansiona il tag NFC o QR Code del commerciante</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary-600 text-xs font-bold">3</span>
            </div>
            <p>Guadagna punti istantaneamente!</p>
          </div>
        </div>
      </Card>

      {/* Recent Scans */}
      {scanHistory.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">Scansioni Recenti</h3>
          <div className="space-y-3">
            {scanHistory.slice(0, 3).map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{scan.business}</p>
                    <p className="text-xs text-gray-500">
                      {scan.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-sm font-medium text-green-600">
                  +{scan.points}
                </div>
              </div>
            ))}
          </div>
          
          {scanHistory.length > 3 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3"
              onClick={() => navigate('/profile')}
            >
              Vedi Cronologia Completa
            </Button>
          )}
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          onClick={() => navigate('/map')}
          className="flex-1"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Trova Commercianti
        </Button>
        <Button 
          variant="outline" 
          onClick={getUserLocation}
          className="flex-1"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Aggiorna Posizione
        </Button>
      </div>

      {/* Tips */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-xs">💡</span>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Suggerimento</p>
            <p>Puoi scansionare fino a 5 tag NFC diversi al giorno per massimizzare i tuoi punti!</p>
          </div>
        </div>
      </Card>
    </div>
  );
};