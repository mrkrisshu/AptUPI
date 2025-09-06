'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, User, CreditCard, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import aptosService from '@/services/aptosService';
import { paymentService } from '@/services/paymentService';

interface UPIData {
  payeeAddress: string;
  payeeName: string;
  amount?: string;
  transactionNote?: string;
  merchantCode?: string;
  transactionRef?: string;
  rawData: string;
}

interface UPIPaymentFlowProps {
  upiData: UPIData;
  onBack: () => void;
  onSuccess: () => void;
}

export default function UPIPaymentFlow({ upiData, onBack, onSuccess }: UPIPaymentFlowProps) {
  const { account, connected } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [step, setStep] = useState<'review' | 'processing' | 'success' | 'error'>('review');
  const [customAmount, setCustomAmount] = useState(upiData.amount || '');
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [processingStep, setProcessingStep] = useState<string>('');

  // Fetch balance when component mounts
  useEffect(() => {
    if (connected && account) {
      fetchBalance();
    }
  }, [connected, account]);

  const fetchBalance = async () => {
    if (!account?.address) return;
    
    try {
      const addressString = typeof account.address === 'string' ? account.address : account.address.toString();
      const usdcBalance = await aptosService.getUSDCBalance(addressString);
      setBalance(usdcBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(0);
    }
  };

  const handlePayment = async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!customAmount || parseFloat(customAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const amountInUSDC = parseFloat(customAmount);
    if (amountInUSDC > balance) {
      setError(`Insufficient balance. You have ${balance} USDC`);
      return;
    }

    setStep('processing');
    setError('');

    try {
      // Step 1: Create payment record
      setProcessingStep('Creating payment record...');
      const paymentData = {
        merchantId: upiData.payeeAddress,
        merchantName: upiData.payeeName,
        amount: amountInUSDC,
        currency: 'USDC',
        description: upiData.transactionNote || `Payment to ${upiData.payeeName}`,
        upiData: {
          payeeAddress: upiData.payeeAddress,
          payeeName: upiData.payeeName,
          merchantCode: upiData.merchantCode,
          transactionRef: upiData.transactionRef,
          originalAmount: upiData.amount
        }
      };

      const payment = await paymentService.createPayment(paymentData);
      
      // Step 2: Create Aptos transaction
      setProcessingStep('Creating blockchain transaction...');
      const transaction = {
        data: {
          function: "0x1::coin::transfer",
          functionArguments: [
            "0x742d35Cc6634C0532925a3b8D400E4C0C0C0C0C0", // Treasury address
            aptosService.parseAmount(amountInUSDC).toString()
          ]
        }
      };

      // Step 3: Sign and submit transaction
      setProcessingStep('Signing transaction...');
      const response = await (window as unknown as { aptos: { signAndSubmitTransaction: (tx: unknown) => Promise<unknown> } }).aptos.signAndSubmitTransaction(transaction);
      const txHash = response.hash || response;
      setTransactionHash(txHash);

      // Step 4: Wait for confirmation
      setProcessingStep('Waiting for confirmation...');
      await aptosService.waitForTransaction(txHash);

      // Step 5: Update payment status
      setProcessingStep('Updating payment status...');
      await paymentService.updatePaymentStatus(payment.id, 'completed', txHash);

      // Step 6: Initiate UPI payout (if applicable)
      if (upiData.payeeAddress && upiData.payeeAddress.includes('@')) {
        setProcessingStep('Initiating UPI payout...');
        try {
          await paymentService.initiateUPIPayout({
            paymentId: payment.id,
            upiId: upiData.payeeAddress,
            amount: amountInUSDC,
            merchantName: upiData.payeeName
          });
        } catch (payoutError) {
          console.warn('UPI payout failed, but payment was successful:', payoutError);
          // Don't fail the entire transaction for payout issues
        }
      }

      setStep('success');
    } catch (err: unknown) {
      console.error('Payment failed:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setStep('error');
    }
  };

  const renderReviewStep = () => (
    <div className="space-y-6">
      {/* UPI Details */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <User className="w-5 h-5 mr-2" />
          UPI Payment Details
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-700">Merchant:</span>
            <span className="font-medium text-blue-900">{upiData.payeeName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">UPI ID:</span>
            <span className="font-mono text-blue-900 text-xs">{upiData.payeeAddress}</span>
          </div>
          {upiData.merchantCode && (
            <div className="flex justify-between">
              <span className="text-blue-700">Merchant Code:</span>
              <span className="font-mono text-blue-900">{upiData.merchantCode}</span>
            </div>
          )}
          {upiData.transactionNote && (
            <div className="flex justify-between">
              <span className="text-blue-700">Note:</span>
              <span className="text-blue-900">{upiData.transactionNote}</span>
            </div>
          )}
        </div>
      </div>

      {/* Amount Input */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount (USDC)
        </label>
        <div className="relative">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            step="0.01"
            min="0"
          />
          <div className="absolute right-3 top-3 text-gray-500 font-medium">
            USDC
          </div>
        </div>
        {upiData.amount && (
          <p className="text-sm text-gray-600 mt-2">
            Original amount from QR: ₹{upiData.amount}
          </p>
        )}
      </div>

      {/* Wallet Info */}
      <div className="bg-green-50 rounded-xl p-4">
        <h3 className="font-semibold text-green-900 mb-3 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Your Wallet
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-green-700">Balance:</span>
            <span className="font-medium text-green-900">{balance} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">Address:</span>
            <span className="font-mono text-green-900 text-xs">
              {account?.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Not connected'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handlePayment}
          disabled={!account || !customAmount || parseFloat(customAmount) <= 0 || parseFloat(customAmount) > balance}
          className="w-full bg-blue-600 text-white rounded-xl py-4 px-6 font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Pay {customAmount} USDC
        </button>
        
        <button
          onClick={onBack}
          className="w-full bg-gray-500 text-white rounded-xl py-3 px-6 font-semibold hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h3>
        <p className="text-gray-600">{processingStep}</p>
      </div>
      
      <div className="bg-blue-50 rounded-xl p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-700">To:</span>
            <span className="font-medium text-blue-900">{upiData.payeeName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Amount:</span>
            <span className="font-medium text-blue-900">{customAmount} USDC</span>
          </div>
          {transactionHash && (
            <div className="flex justify-between">
              <span className="text-blue-700">Tx Hash:</span>
              <span className="font-mono text-blue-900 text-xs">
                {transactionHash.slice(0, 8)}...{transactionHash.slice(-8)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600">Your payment has been processed successfully</p>
      </div>
      
      <div className="bg-green-50 rounded-xl p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-green-700">Paid to:</span>
            <span className="font-medium text-green-900">{upiData.payeeName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">Amount:</span>
            <span className="font-medium text-green-900">{customAmount} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">Transaction:</span>
            <span className="font-mono text-green-900 text-xs">
              {transactionHash.slice(0, 8)}...{transactionHash.slice(-8)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={onSuccess}
          className="w-full bg-green-600 text-white rounded-xl py-4 px-6 font-semibold hover:bg-green-700 transition-colors"
        >
          Done
        </button>
        
        <button
          onClick={onBack}
          className="w-full bg-gray-500 text-white rounded-xl py-3 px-6 font-semibold hover:bg-gray-600 transition-colors"
        >
          Scan Another QR
        </button>
      </div>
    </div>
  );

  const renderErrorStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h3>
        <p className="text-gray-600">{error}</p>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={() => setStep('review')}
          className="w-full bg-blue-600 text-white rounded-xl py-4 px-6 font-semibold hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        
        <button
          onClick={onBack}
          className="w-full bg-gray-500 text-white rounded-xl py-3 px-6 font-semibold hover:bg-gray-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            disabled={step === 'processing'}
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">UPI Payment</h1>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          {step === 'review' && renderReviewStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'success' && renderSuccessStep()}
          {step === 'error' && renderErrorStep()}
        </div>
      </div>
    </div>
  );
}