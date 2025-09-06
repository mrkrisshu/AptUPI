'use client';

import { useState, useEffect } from 'react';
import { Wallet, QrCode, CreditCard, ArrowRight, Smartphone, TestTube } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import WalletConnect from '@/components/WalletConnect';
import PaymentFlow from '@/components/PaymentFlow';
import QRScanner from '@/components/QRScanner';
import UPIQRScanner from '@/components/UPIQRScanner';
import UPIPaymentFlow from '@/components/UPIPaymentFlow';
import TestQRCode from '@/components/TestQRCode';
import aptosService from '@/services/aptosService';

interface UPIData {
  payeeAddress: string;
  payeeName: string;
  amount?: string;
  transactionNote?: string;
  merchantCode?: string;
  transactionRef?: string;
  rawData: string;
}

export default function Home() {
  const { connected, account } = useWallet();
  const [currentView, setCurrentView] = useState<'home' | 'scan' | 'upi-scan' | 'payment' | 'upi-payment' | 'test-qr'>('home');
  const [merchantData, setMerchantData] = useState<{ merchantName?: string; amount?: number; upiId?: string } | null>(null);
  const [upiData, setUpiData] = useState<UPIData | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [balanceInINR, setBalanceInINR] = useState<number>(0);

  // Fetch balance when wallet connects
  useEffect(() => {
    if (connected && account) {
      fetchBalance();
    } else {
      setBalance(0);
      setBalanceInINR(0);
    }
  }, [connected, account]);

  const fetchBalance = async () => {
    if (!account?.address) return;
    
    try {
      const addressString = typeof account.address === 'string' ? account.address : account.address.toString();
      const aptBalance = await aptosService.getUSDCBalance(addressString);
      setBalance(aptBalance);
      // Convert APT to INR (mock rate: 1 APT = 830 INR)
      setBalanceInINR(aptBalance * 830);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleQRScan = (data: { merchantName?: string; amount?: number; upiId?: string }) => {
    setMerchantData(data);
    setCurrentView('payment');
  };

  const handleUPIScan = (data: UPIData) => {
    setUpiData(data);
    setCurrentView('upi-payment');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">AptPay</h1>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {currentView === 'home' && (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Pay with Crypto</h2>
              <p className="text-gray-600">Merchants receive INR via UPI</p>
            </div>

            {/* Balance Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Balance</h3>
                <Wallet className="w-5 h-5 text-gray-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">APT</span>
                  <span className="font-semibold">{balance.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">≈ INR</span>
                  <span className="text-gray-500">₹{balanceInINR.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView('upi-scan')}
                disabled={!connected}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-4 px-6 flex items-center justify-center space-x-3 font-semibold shadow-lg hover:shadow-xl transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Smartphone className="w-5 h-5" />
                <span>Scan UPI QR Code</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setCurrentView('scan')}
                disabled={!connected}
                className="w-full bg-white text-gray-700 rounded-xl py-4 px-6 flex items-center justify-center space-x-3 font-semibold border border-gray-200 hover:bg-gray-50 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <QrCode className="w-5 h-5" />
                <span>Scan Test QR Code</span>
              </button>
              
              <button 
                onClick={() => setCurrentView('test-qr')}
                className="w-full bg-yellow-500 text-white rounded-xl py-4 px-6 flex items-center justify-center space-x-3 font-semibold hover:bg-yellow-600 transition-all"
              >
                <TestTube className="w-5 h-5" />
                <span>Generate Test QR Code</span>
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white rounded-xl p-4 text-center border">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 text-xl">⚡</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Instant</h4>
                <p className="text-gray-600 text-xs">Real-time payments</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 text-center border">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 text-xl">🔒</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Secure</h4>
                <p className="text-gray-600 text-xs">Blockchain powered</p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'scan' && (
          <QRScanner 
            onScan={handleQRScan}
            onBack={() => setCurrentView('home')}
          />
        )}

        {currentView === 'upi-scan' && (
          <UPIQRScanner 
            onScan={handleUPIScan}
            onBack={() => setCurrentView('home')}
          />
        )}

        {currentView === 'test-qr' && (
          <TestQRCode 
            onClose={() => setCurrentView('home')}
          />
        )}

        {currentView === 'payment' && merchantData && (
          <PaymentFlow 
            merchantData={merchantData}
            onBack={() => setCurrentView('home')}
            onComplete={() => setCurrentView('home')}
          />
        )}

        {currentView === 'upi-payment' && upiData && (
          <UPIPaymentFlow 
            upiData={upiData}
            onBack={() => setCurrentView('home')}
            onSuccess={() => {
              setCurrentView('home');
              setUpiData(null);
              fetchBalance();
            }}
          />
        )}
      </main>
    </div>
  );
}
