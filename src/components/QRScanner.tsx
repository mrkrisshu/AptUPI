'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, AlertCircle } from 'lucide-react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onScan: (data: { merchantName?: string; amount?: number; upiId?: string }) => void;
  onBack: () => void;
}

export default function QRScanner({ onScan, onBack }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [scanAttempts, setScanAttempts] = useState<number>(0);

  useEffect(() => {
    initializeScanner();
    return () => {
      if (scanner) {
        scanner.destroy();
      }
    };
  }, []);

  const initializeScanner = async () => {
    try {
      // Check if we're on HTTPS (required for camera access on mobile)
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setError('Camera access requires HTTPS. Please use a secure connection.');
        setHasCamera(false);
        return;
      }

      // Request camera permissions explicitly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment' // Prefer back camera on mobile
          } 
        });
        // Stop the stream immediately as we just needed to check permissions
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionErr) {
        console.error('Camera permission denied:', permissionErr);
        setError('Camera access denied. Please allow camera permissions and refresh the page.');
        setHasCamera(false);
        return;
      }

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      setHasCamera(hasCamera);
      
      if (!hasCamera) {
        setError('No camera found on this device');
        return;
      }

      if (videoRef.current) {
        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            const attempts = scanAttempts + 1;
            setScanAttempts(attempts);
            setDebugInfo(`Scan attempt #${attempts}: ${result.data.substring(0, 50)}...`);
            console.log('QR Code detected:', result.data);
            handleScanResult(result.data);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment', // Use back camera on mobile
            maxScansPerSecond: 5, // Optimize for mobile performance
          }
        );
        
        setScanner(qrScanner);
        await qrScanner.start();
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Failed to initialize scanner:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission denied')) {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (errorMessage.includes('NotFoundError')) {
        setError('No camera found on this device.');
      } else if (errorMessage.includes('NotSupportedError')) {
        setError('Camera not supported on this device or browser.');
      } else {
        setError('Failed to access camera. Please check permissions and try again.');
      }
      setHasCamera(false);
    }
  };

  const handleScanResult = (data: string) => {
    try {
      // Parse QR code data - expecting JSON with merchant info
      const merchantData = JSON.parse(data);
      
      setDebugInfo(`Successfully parsed QR data: ${JSON.stringify(merchantData, null, 2)}`);
      
      // Validate required fields
      if (!merchantData.merchantId || !merchantData.amount) {
        throw new Error('Invalid QR code format');
      }
      
      // Stop scanning
      if (scanner) {
        scanner.stop();
      }
      
      onScan(merchantData);
    } catch (err) {
      console.error('Invalid QR code:', err);
      setError('Invalid QR code. Please scan a valid merchant QR code.');
      setDebugInfo(`Parse error: ${err}. Raw data: ${data}`);
      
      // Clear error after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBack = () => {
    if (scanner) {
      scanner.stop();
    }
    onBack();
  };

  if (!hasCamera) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Scan QR Code</h2>
        </div>

        {/* No Camera Message */}
        <div className="bg-white rounded-2xl p-8 text-center space-y-4 border">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No Camera Available</h3>
          <p className="text-gray-600 mb-4">
            {error || "This device doesn't have a camera or camera access is not available."}
          </p>
          
          {/* Mobile-specific instructions */}
          <div className="bg-blue-50 rounded-lg p-4 text-left space-y-2">
            <h4 className="font-semibold text-blue-900 text-sm">For mobile devices:</h4>
            <ul className="text-blue-800 text-xs space-y-1">
              <li>• Allow camera permissions when prompted</li>
              <li>• Ensure you're using HTTPS (secure connection)</li>
              <li>• Try refreshing the page after allowing permissions</li>
              <li>• Check if camera is being used by another app</li>
            </ul>
          </div>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Refresh & Try Again
            </button>
            <button
              onClick={handleBack}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Scan QR Code</h2>
      </div>

      {/* Scanner Container */}
      <div className="bg-white rounded-2xl p-4 border">
        <div className="relative aspect-square bg-black rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          
          {/* Scanning Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-white rounded-2xl relative">
              {/* Corner indicators */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
            </div>
          </div>
          
          {/* Camera Icon */}
          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <Camera className="w-12 h-12 text-white" />
            </div>
          )}
        </div>
        
        {/* Instructions */}
        <div className="mt-4 text-center space-y-2">
          <p className="text-gray-900 font-medium">Position QR code within the frame</p>
          <p className="text-gray-600 text-sm">
            Make sure the QR code is clearly visible and well-lit
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-red-900">Scan Error</h4>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Debug Information */}
      {debugInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 text-sm mb-2">Debug Info</h4>
          <p className="text-blue-700 text-xs font-mono">{debugInfo}</p>
          <p className="text-blue-600 text-xs mt-2">
            Scan attempts: {scanAttempts} | Camera: {hasCamera ? 'Available' : 'Not Available'}
          </p>
        </div>
      )}

      {/* Manual Entry Option */}
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-gray-600 text-sm mb-3">
          Having trouble scanning? You can also enter merchant details manually.
        </p>
        <button
          onClick={handleBack}
          className="text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors"
        >
          Enter Merchant ID Instead
        </button>
      </div>
    </div>
  );
}