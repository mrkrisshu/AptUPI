'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import aptosService from '@/services/aptosService';

interface PaymentFlowProps {
  merchantData: {
    merchantId: string;
    merchantName: string;
    amount: number;
    currency: string;
    description?: string;
    upiId?: string;
  };
  onBack: () => void;
  onComplete: () => void;
}

type PaymentStatus = 'review' | 'processing' | 'success' | 'failed';

export default function PaymentFlow({ merchantData, onBack, onComplete }: PaymentFlowProps) {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [status, setStatus] = useState<PaymentStatus>('review');
  const [exchangeRate, setExchangeRate] = useState<number>(830); // INR per APT
  const [aptAmount, setAptAmount] = useState<number>(0);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Calculate APT amount based on INR amount and exchange rate
    const calculatedAptAmount = merchantData.amount / exchangeRate;
    setAptAmount(Number(calculatedAptAmount.toFixed(6)));
    
    // Fetch real-time exchange rate
    fetchExchangeRate();
  }, [merchantData.amount]);

  const fetchExchangeRate = async () => {
    try {
      // This would typically call your backend API
      // For now, we'll use a mock rate: 1 APT = 830 INR
      setExchangeRate(830);
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
    }
  };

  const handlePayment = async () => {
    if (!connected || !account) {
      setError('Please connect your wallet first');
      return;
    }

    setStatus('processing');
    setError('');

    try {
      // Create APT transfer transaction using the correct format
      const transaction = {
        data: {
          function: '0x1::aptos_account::transfer',
          functionArguments: [
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // Mock escrow wallet
            aptosService.parseAmount(aptAmount).toString(), // Amount in octas as string
          ],
        },
      };

      // Sign and submit transaction
      const response = await signAndSubmitTransaction(transaction);
      const txHash = typeof response === 'string' ? response : response.hash;
      setTransactionHash(txHash);

      // Wait for transaction confirmation
      await aptosService.waitForTransaction(txHash);

      // Call backend to initiate UPI payout
      await initiateUpiPayout(txHash);
      
      setStatus('success');
    } catch (error) {
      console.error('Payment failed:', error);
      setError(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('failed');
    }
  };

  const initiateUpiPayout = async (txHash: string) => {
    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: merchantData.merchantId,
          amount: merchantData.amount,
          currency: merchantData.currency,
          transactionHash: txHash,
          upiId: merchantData.upiId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate UPI payout');
      }
    } catch (error) {
      console.error('UPI payout initiation failed:', error);
      // Don't fail the entire payment for this
    }
  };

  const renderReviewStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Review Payment</h2>
      </div>

      {/* Merchant Info */}
      <div className="bg-white rounded-2xl p-6 border">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {merchantData.merchantName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{merchantData.merchantName}</h3>
            <p className="text-gray-600 text-sm">ID: {merchantData.merchantId}</p>
          </div>
        </div>
        
        {merchantData.description && (
          <p className="text-gray-700 text-sm">{merchantData.description}</p>
        )}
      </div>

      {/* Payment Details */}
      <div className="bg-white rounded-2xl p-6 border">
        <h4 className="font-semibold text-gray-900 mb-4">Payment Details</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount (INR)</span>
            <span className="font-semibold">₹{merchantData.amount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Exchange Rate</span>
            <span className="text-sm text-gray-500">1 APT = ₹{exchangeRate}</span>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="text-gray-600">You Pay (APT)</span>
              <span className="font-semibold text-lg">{aptAmount} APT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Balance Check */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-white text-xs">i</span>
          </div>
          <div>
            <p className="text-blue-900 font-medium text-sm">Payment Process</p>
            <p className="text-blue-700 text-sm">
              Your APT will be transferred to an escrow wallet. The merchant will receive INR via UPI instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-red-900">Error</h4>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={!connected}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-4 px-6 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {connected ? `Pay ${aptAmount} APT` : 'Connect Wallet to Pay'}
      </button>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="space-y-6 text-center">
      <div className="bg-white rounded-2xl p-8 border">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h3>
        <p className="text-gray-600">
          Please wait while we process your transaction...
        </p>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="bg-white rounded-2xl p-8 border">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600 mb-4">
          Your payment has been processed successfully. The merchant will receive INR via UPI.
        </p>
        
        {transactionHash && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
            <div className="flex items-center justify-center space-x-2">
              <code className="text-xs bg-white px-2 py-1 rounded border">
                {transactionHash.slice(0, 20)}...
              </code>
              <button className="text-blue-600 hover:text-blue-700">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onComplete}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl py-4 px-6 font-semibold shadow-lg hover:shadow-xl transition-all"
      >
        Done
      </button>
    </div>
  );

  const renderFailedStep = () => (
    <div className="space-y-6 text-center">
      <div className="bg-white rounded-2xl p-8 border">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h3>
        <p className="text-gray-600 mb-4">{error}</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setStatus('review')}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-4 px-6 font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          Try Again
        </button>
        
        <button
          onClick={onBack}
          className="w-full bg-gray-100 text-gray-700 rounded-xl py-4 px-6 font-semibold hover:bg-gray-200 transition-all"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  switch (status) {
    case 'review':
      return renderReviewStep();
    case 'processing':
      return renderProcessingStep();
    case 'success':
      return renderSuccessStep();
    case 'failed':
      return renderFailedStep();
    default:
      return renderReviewStep();
  }
}