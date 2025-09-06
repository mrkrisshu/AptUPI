'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, AlertCircle, CheckCircle, Upload, FileImage } from 'lucide-react';
import QrScanner from 'qr-scanner';

interface UPIQRScannerProps {
  onScan: (upiData: UPIData) => void;
  onBack: () => void;
}

interface UPIData {
  payeeAddress: string;
  payeeName: string;
  amount?: string;
  transactionNote?: string;
  merchantCode?: string;
  transactionRef?: string;
  rawData: string;
}

export default function UPIQRScanner({ onScan, onBack }: UPIQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [scanAttempts, setScanAttempts] = useState<number>(0);
  const [lastScannedData, setLastScannedData] = useState<string>('');
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      initializeScanner();
    }

    return () => {
      if (scanner) {
        scanner.destroy();
      }
    };
  }, []);

  const initializeScanner = async () => {
    try {
      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      setHasCamera(hasCamera);

      if (!hasCamera) {
        setError('No camera available on this device');
        return;
      }

      if (!videoRef.current) return;

      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          const attempts = scanAttempts + 1;
          setScanAttempts(attempts);
          setLastScannedData(result.data);
          setDebugInfo(`Scan #${attempts}: ${result.data.substring(0, 100)}...`);
          console.log('QR Code detected:', result.data);
          handleUPIScan(result.data);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      setScanner(qrScanner);
      await qrScanner.start();
      setIsScanning(true);
      setError('');
    } catch (err) {
      console.error('Scanner initialization failed:', err);
      setError('Failed to initialize camera. Please check permissions.');
      setHasCamera(false);
    }
  };

  const handleUPIScan = (data: string) => {
    try {
      // Parse UPI QR code data
      const upiData = parseUPIQRCode(data);
      
      if (upiData) {
        setDebugInfo(`✅ Valid UPI QR: ${upiData.payeeName} (${upiData.payeeAddress})`);
        onScan(upiData);
      } else {
        setError('This is not a valid UPI QR code');
        setDebugInfo(`❌ Invalid UPI format: ${data.substring(0, 100)}...`);
      }
    } catch (err) {
      console.error('UPI parsing error:', err);
      setError('Failed to parse QR code data');
      setDebugInfo(`❌ Parse error: ${err}`);
    }
  };

  const parseUPIQRCode = (data: string): UPIData | null => {
    try {
      // Check if it's a standard UPI URL format (upi://pay?...)
      if (data.startsWith('upi://pay')) {
        const url = new URL(data);
        const params = url.searchParams;
        
        const payeeAddress = params.get('pa') || '';
        const payeeName = params.get('pn') || '';
        const amount = params.get('am') || '';
        const transactionNote = params.get('tn') || params.get('tr') || '';
        const merchantCode = params.get('mc') || params.get('mid') || '';
        const transactionRef = params.get('tr') || params.get('tid') || '';
        
        // Validate that we have at least a payee address
        if (!payeeAddress) {
          console.error('Invalid UPI QR: Missing payee address');
          return null;
        }
        
        return {
          payeeAddress,
          payeeName,
          amount,
          transactionNote,
          merchantCode,
          transactionRef,
          rawData: data
        };
      }
      
      // UPI QR codes typically start with 'upi://pay?' or contain UPI payment URL
      if (data.toLowerCase().includes('upi://pay?') || data.toLowerCase().includes('upiqr')) {
        return parseUPIURL(data);
      }
      
      // Check for other UPI formats (some QR codes use different formats)
      if (data.includes('@') && (data.includes('paytm') || data.includes('phonepe') || data.includes('gpay') || data.includes('ybl'))) {
        return parseAlternativeUPIFormat(data);
      }

      // Try to parse as JSON (some merchants use JSON format)
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.upi || jsonData.vpa || jsonData.payeeAddress) {
          return parseJSONUPIFormat(jsonData);
        }
      } catch {
        // Not JSON, continue with other parsing methods
      }

      return null;
    } catch (error) {
      console.error('UPI parsing error:', error);
      return null;
    }
  };

  const parseUPIURL = (data: string): UPIData | null => {
    try {
      // Parse UPI URL format: upi://pay?pa=merchant@bank&pn=MerchantName&am=100&tn=TransactionNote
      const url = new URL(data.replace('upi://', 'https://'));
      const params = url.searchParams;

      const payeeAddress = params.get('pa') || '';
      const payeeName = params.get('pn') || 'Unknown Merchant';
      const amount = params.get('am') || params.get('amount') || '';
      const transactionNote = params.get('tn') || params.get('note') || '';
      const merchantCode = params.get('mc') || params.get('mid') || '';
      const transactionRef = params.get('tr') || params.get('tid') || '';

      if (!payeeAddress) {
        return null;
      }

      return {
        payeeAddress,
        payeeName,
        amount,
        transactionNote,
        merchantCode,
        transactionRef,
        rawData: data
      };
    } catch (error) {
      console.error('UPI URL parsing error:', error);
      return null;
    }
  };

  const parseAlternativeUPIFormat = (data: string): UPIData | null => {
    try {
      // Some QR codes just contain the UPI ID and amount in different formats
      const lines = data.split('\n').map(line => line.trim());
      let payeeAddress = '';
      let payeeName = 'Unknown Merchant';
      let amount = '';
      
      for (const line of lines) {
        if (line.includes('@')) {
          payeeAddress = line;
        } else if (line.toLowerCase().includes('amount') || line.toLowerCase().includes('rs')) {
          const amountMatch = line.match(/\d+(\.\d+)?/);
          if (amountMatch) {
            amount = amountMatch[0];
          }
        } else if (line.length > 3 && !line.includes('@') && !line.match(/\d+/)) {
          payeeName = line;
        }
      }

      if (!payeeAddress) {
        return null;
      }

      return {
        payeeAddress,
        payeeName,
        amount,
        transactionNote: '',
        merchantCode: '',
        transactionRef: '',
        rawData: data
      };
    } catch (error) {
      console.error('Alternative UPI parsing error:', error);
      return null;
    }
  };

  const parseJSONUPIFormat = (jsonData: any): UPIData | null => {
    try {
      const payeeAddress = jsonData.upi || jsonData.vpa || jsonData.payeeAddress || '';
      const payeeName = jsonData.name || jsonData.merchantName || jsonData.payeeName || 'Unknown Merchant';
      const amount = jsonData.amount || jsonData.am || '';
      const transactionNote = jsonData.note || jsonData.tn || jsonData.description || '';
      const merchantCode = jsonData.merchantCode || jsonData.mc || jsonData.mid || '';
      
      if (!payeeAddress) {
        return null;
      }

      return {
        payeeAddress,
        payeeName,
        amount: amount.toString(),
        transactionNote,
        merchantCode,
        transactionRef: '',
        rawData: JSON.stringify(jsonData)
      };
    } catch (error) {
      console.error('JSON UPI parsing error:', error);
      return null;
    }
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.stop();
      setIsScanning(false);
    }
  };

  const startScanning = async () => {
    if (scanner) {
      try {
        await scanner.start();
        setIsScanning(true);
        setError('');
      } catch (err) {
        console.error('Failed to start scanner:', err);
        setError('Failed to start camera');
      }
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError('');
      setDebugInfo('Processing uploaded file...');
      
      const result = await QrScanner.scanImage(file);
      setDebugInfo('QR scan result: ' + result);
      
      if (result) {
        handleUPIScan(result);
      } else {
        setError('No QR code found in the uploaded image');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      setError('Failed to scan QR code from uploaded image');
      setDebugInfo('Error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Scan UPI QR Code</h1>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-white rounded-xl p-1 mb-6 shadow-sm">
          <button
            onClick={() => setScanMode('camera')}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg transition-all ${
              scanMode === 'camera'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Camera className="w-4 h-4 mr-2" />
            Camera
          </button>
          <button
            onClick={() => setScanMode('upload')}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg transition-all ${
              scanMode === 'upload'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileImage className="w-4 h-4 mr-2" />
            Upload
          </button>
        </div>

        {/* Camera/Upload View */}
        {scanMode === 'camera' ? (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            {hasCamera ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover rounded-xl bg-gray-100"
                  playsInline
                  muted
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none">
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-4 border-t-4 border-blue-500"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-4 border-t-4 border-blue-500"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-4 border-b-4 border-blue-500"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-4 border-b-4 border-blue-500"></div>
                </div>
                
                {/* Scanning Status */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                    <Camera className="w-4 h-4" />
                    <span>{isScanning ? 'Scanning...' : 'Camera Ready'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Camera Available</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Camera access is blocked. Try the upload option instead.
                </p>
                <button
                  onClick={() => setScanMode('upload')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Switch to Upload
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <div className="relative h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload QR Code Image</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Take a screenshot or photo of the UPI QR code and upload it here.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Choose Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 text-sm">Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Debug Information */}
        {debugInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">Debug Info</h4>
            <p className="text-blue-700 text-xs font-mono">{debugInfo}</p>
            <p className="text-blue-600 text-xs mt-2">
              Scan attempts: {scanAttempts} | Camera: {hasCamera ? 'Available' : 'Not Available'}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 rounded-xl p-4 text-center mb-4">
          <h4 className="font-semibold text-gray-900 text-sm mb-2">
            {scanMode === 'camera' ? 'How to Scan UPI QR Codes' : 'How to Upload QR Code Images'}
          </h4>
          <div className="text-gray-600 text-sm space-y-1">
            {scanMode === 'camera' ? (
              <>
                <p>• Point camera at any UPI QR code (GPay, PhonePe, Paytm, etc.)</p>
                <p>• Ensure good lighting and steady hands</p>
                <p>• QR code will be automatically detected and parsed</p>
                <p>• Supports all standard UPI QR code formats</p>
              </>
            ) : (
              <>
                <p>• Take a screenshot of the UPI QR code on your phone</p>
                <p>• Or take a clear photo of a printed QR code</p>
                <p>• Upload the image using the button above</p>
                <p>• Works with GPay, PhonePe, Paytm, and all UPI QR codes</p>
              </>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="space-y-3">
          {scanMode === 'camera' && hasCamera && (
            <div className="flex space-x-3">
              {isScanning ? (
                <button
                  onClick={stopScanning}
                  className="flex-1 bg-red-500 text-white rounded-xl py-3 px-4 font-semibold hover:bg-red-600 transition-colors"
                >
                  Stop Scanning
                </button>
              ) : (
                <button
                  onClick={startScanning}
                  className="flex-1 bg-green-500 text-white rounded-xl py-3 px-4 font-semibold hover:bg-green-600 transition-colors"
                >
                  Start Scanning
                </button>
              )}
            </div>
          )}
          
          <button
            onClick={onBack}
            className="w-full bg-gray-500 text-white rounded-xl py-3 px-4 font-semibold hover:bg-gray-600 transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Last Scanned Data (for debugging) */}
        {lastScannedData && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="font-semibold text-yellow-900 text-sm mb-2">Last Scanned Data</h4>
            <p className="text-yellow-700 text-xs font-mono break-all">{lastScannedData}</p>
          </div>
        )}
      </div>
    </div>
  );
}