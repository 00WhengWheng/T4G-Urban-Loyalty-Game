import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Check, 
  X, 
  AlertTriangle,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { toast } from 'sonner';

interface NFCTestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export const NFCTester: React.FC = () => {
  const [isNFCSupported, setIsNFCSupported] = useState<boolean | null>(null);
  const [ndefReader, setNdefReader] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [testResults, setTestResults] = useState<NFCTestResult[]>([]);
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  useEffect(() => {
    performSystemChecks();
  }, []);

  const performSystemChecks = async () => {
    const tests: NFCTestResult[] = [
      { test: 'NFC API Support', status: 'pending', message: 'Checking Web NFC API...' },
      { test: 'HTTPS Connection', status: 'pending', message: 'Verifying secure connection...' },
      { test: 'User Agent', status: 'pending', message: 'Checking browser compatibility...' },
      { test: 'Permissions', status: 'pending', message: 'Checking NFC permissions...' }
    ];

    setTestResults(tests);

    // Test 1: NFC API Support
    await new Promise(resolve => setTimeout(resolve, 500));
    const nfcSupported = 'NDEFReader' in window;
    setIsNFCSupported(nfcSupported);
    
    updateTestResult(0, {
      status: nfcSupported ? 'success' : 'error',
      message: nfcSupported ? 'Web NFC API is supported' : 'Web NFC API not available',
      details: { nfcInWindow: 'NDEFReader' in window }
    });

    // Test 2: HTTPS Check
    await new Promise(resolve => setTimeout(resolve, 300));
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    updateTestResult(1, {
      status: isHttps ? 'success' : 'error',
      message: isHttps ? 'Running on secure connection' : 'HTTPS required for NFC',
      details: { protocol: window.location.protocol, hostname: window.location.hostname }
    });

    // Test 3: User Agent
    await new Promise(resolve => setTimeout(resolve, 300));
    const userAgent = navigator.userAgent;
    const isAndroid = /Android/i.test(userAgent);
    const isChrome = /Chrome/i.test(userAgent);
    const isSupportedBrowser = isAndroid && isChrome;

    updateTestResult(2, {
      status: isSupportedBrowser ? 'success' : 'error',
      message: isSupportedBrowser 
        ? 'Browser supports NFC' 
        : 'Chrome on Android required for NFC',
      details: { userAgent, isAndroid, isChrome }
    });

    // Test 4: Permissions
    await new Promise(resolve => setTimeout(resolve, 300));
    if (nfcSupported) {
      try {
        const reader = new (window as any).NDEFReader();
        setNdefReader(reader);
        updateTestResult(3, {
          status: 'success',
          message: 'NDEFReader instance created successfully',
          details: { reader: 'Available' }
        });
      } catch (error) {
        updateTestResult(3, {
          status: 'error',
          message: `Failed to create NDEFReader: ${error}`,
          details: { error: error?.toString() }
        });
      }
    } else {
      updateTestResult(3, {
        status: 'error',
        message: 'Cannot test permissions - NFC not supported',
        details: { reason: 'NFC not available' }
      });
    }
  };

  const updateTestResult = (index: number, update: Partial<NFCTestResult>) => {
    setTestResults(prev => prev.map((test, i) => 
      i === index ? { ...test, ...update } : test
    ));
  };

  const startNFCScan = async () => {
    if (!ndefReader) {
      toast.error('NFC Reader not available');
      return;
    }

    setIsScanning(true);
    toast.info('Hold your device near an NFC tag...');

    try {
      await ndefReader.scan();
      
      ndefReader.addEventListener('reading', ({ message, serialNumber }: any) => {
        console.log('NFC Reading event:', { message, serialNumber });
        
        const scanData = {
          id: Date.now().toString(),
          timestamp: new Date(),
          serialNumber,
          records: message.records.map((record: any) => ({
            recordType: record.recordType,
            mediaType: record.mediaType,
            data: record.data,
            text: record.recordType === 'text' ? new TextDecoder().decode(record.data) : null
          }))
        };

        setScanHistory(prev => [scanData, ...prev]);
        toast.success(`NFC Tag detected! Serial: ${serialNumber}`);
        setIsScanning(false);
      });

      ndefReader.addEventListener('readingerror', (error: any) => {
        console.error('NFC Reading error:', error);
        toast.error(`NFC Reading error: ${error}`);
        setIsScanning(false);
      });

    } catch (error) {
      console.error('NFC Scan error:', error);
      toast.error(`Failed to start NFC scan: ${error}`);
      setIsScanning(false);
    }
  };

  const stopNFCScan = async () => {
    if (ndefReader) {
      try {
        await ndefReader.stop();
        setIsScanning(false);
        toast.info('NFC scanning stopped');
      } catch (error) {
        console.error('Error stopping NFC scan:', error);
      }
    }
  };

  const testWriteNFC = async () => {
    if (!ndefReader) {
      toast.error('NFC Reader not available');
      return;
    }

    try {
      const testMessage = {
        records: [{
          recordType: "text",
          data: "T4G Test Tag - " + new Date().toISOString()
        }]
      };

      await ndefReader.write(testMessage);
      toast.success('Test data written to NFC tag!');
    } catch (error) {
      console.error('NFC Write error:', error);
      toast.error(`Failed to write NFC tag: ${error}`);
    }
  };

  const getStatusIcon = (status: NFCTestResult['status']) => {
    switch (status) {
      case 'success': return <Check className="w-4 h-4 text-green-500" />;
      case 'error': return <X className="w-4 h-4 text-red-500" />;
      default: return <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">NFC Tester</h1>
        <p className="text-gray-600">Test NFC functionality on your device</p>
      </div>

      {/* System Check Results */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">System Compatibility</h2>
        <div className="space-y-3">
          {testResults.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(test.status)}
                <div>
                  <p className="font-medium text-sm">{test.test}</p>
                  <p className="text-xs text-gray-500">{test.message}</p>
                </div>
              </div>
              <Badge 
                variant={test.status === 'success' ? 'success' : test.status === 'error' ? 'error' : 'default'}
                size="sm"
              >
                {test.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* NFC Testing Controls */}
      {isNFCSupported && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">NFC Testing</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={startNFCScan}
                disabled={isScanning || !ndefReader}
                className="flex items-center justify-center"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 mr-2" />
                    Start Scan
                  </>
                )}
              </Button>

              <Button 
                onClick={stopNFCScan}
                disabled={!isScanning}
                variant="outline"
              >
                <WifiOff className="w-4 h-4 mr-2" />
                Stop Scan
              </Button>

              <Button 
                onClick={testWriteNFC}
                disabled={isScanning || !ndefReader}
                variant="outline"
              >
                <Zap className="w-4 h-4 mr-2" />
                Test Write
              </Button>
            </div>

            {isScanning && (
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200"
              >
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">Hold device near NFC tag...</span>
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Scan History</h2>
          <div className="space-y-3">
            {scanHistory.map((scan) => (
              <div key={scan.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-green-800">Tag Detected</span>
                  <span className="text-xs text-green-600">
                    {scan.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Serial:</strong> {scan.serialNumber}</p>
                  <p><strong>Records:</strong> {scan.records.length}</p>
                  {scan.records.map((record: any, index: number) => (
                    <div key={index} className="pl-4 border-l-2 border-gray-200">
                      <p><strong>Type:</strong> {record.recordType}</p>
                      {record.text && <p><strong>Text:</strong> {record.text}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
          <div className="text-sm text-yellow-800">
            <h3 className="font-medium mb-2">Testing Requirements:</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Android device with NFC enabled</li>
              <li>Chrome or Edge browser</li>
              <li>HTTPS connection (or localhost)</li>
              <li>Physical NFC tags with NDEF records</li>
              <li>Grant NFC permissions when prompted</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
