'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Copy, Check } from 'lucide-react';

interface TestQRCodeProps {
  onClose: () => void;
}

export default function TestQRCode({ onClose }: TestQRCodeProps) {
  const [copied, setCopied] = useState(false);
  
  // Generate real UPI QR code format that works with GPay/PhonePe/Paytm
  const generateRealUPIQR = () => {
    const upiParams = new URLSearchParams({
      pa: 'testcoffeeshop@paytm',  // Payee Address (UPI ID)
      pn: 'Test Coffee Shop',      // Payee Name
      am: '100.00',               // Amount
      tn: 'Coffee and Snacks',    // Transaction Note
      mc: 'COFFEE001',            // Merchant Code
      tr: 'TXN' + Date.now()      // Transaction Reference
    });
    return `upi://pay?${upiParams.toString()}`;
  };
  
  const qrData = generateRealUPIQR();
  
  // Also create a sample for display
  const sampleData = {
    payeeAddress: 'testcoffeeshop@paytm',
    payeeName: 'Test Coffee Shop',
    amount: '100.00',
    transactionNote: 'Coffee and Snacks'
  };
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Test QR Code</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ×
        </button>
      </div>
      
      {/* QR Code */}
      <div className="bg-white rounded-2xl p-8 text-center border">
        <div className="bg-white p-4 rounded-xl inline-block">
          <QRCode
            size={200}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            value={qrData}
            viewBox={`0 0 200 200`}
          />
        </div>
        
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold text-gray-900">{sampleData.payeeName}</h3>
          <p className="text-gray-600">Amount: ₹{sampleData.amount}</p>
          <p className="text-gray-500 text-sm">{sampleData.transactionNote}</p>
          <p className="text-gray-400 text-xs">UPI ID: {sampleData.payeeAddress}</p>
        </div>
      </div>
      
      {/* QR Data */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900 text-sm">QR Code Data:</h4>
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto">
          {qrData}
        </pre>
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="font-semibold text-blue-900 text-sm mb-2">How to Test:</h4>
        <ol className="text-blue-800 text-sm space-y-1">
          <li>1. Use your phone to scan this QR code with the app</li>
          <li>2. Or take a screenshot and scan it from another device</li>
          <li>3. The scanner should detect and parse the merchant data</li>
          <li>4. Check browser console for any error messages</li>
        </ol>
      </div>
      
      {/* Debug Info */}
      <div className="bg-yellow-50 rounded-xl p-4">
        <h4 className="font-semibold text-yellow-900 text-sm mb-2">Debug Info:</h4>
        <ul className="text-yellow-800 text-sm space-y-1">
          <li>• QR Data Length: {qrData.length} characters</li>
          <li>• Format: JSON string</li>
          <li>• Required Fields: merchantId, amount</li>
          <li>• Camera Required: Yes (HTTPS for mobile)</li>
        </ul>
      </div>
    </div>
  );
}