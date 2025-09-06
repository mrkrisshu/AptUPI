'use client';

import { useState, useEffect } from 'react';
import { Wallet, ChevronDown, LogOut } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import aptosService from '@/services/aptosService';

interface WalletConnectProps {
  className?: string;
}

export default function WalletConnect({ className = '' }: WalletConnectProps) {
  const { connect, disconnect, account, connected, wallets } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [balance, setBalance] = useState<string>('0.00');

  // Fetch wallet balance
  useEffect(() => {
    if (connected && account) {
      fetchBalance();
    } else {
      setBalance('0.00');
    }
  }, [connected, account]);

  const fetchBalance = async () => {
    if (!account?.address) return;
    
    try {
      const addressString = typeof account.address === 'string' ? account.address : account.address.toString();
      const aptBalance = await aptosService.getUSDCBalance(addressString);
      setBalance(aptBalance.toFixed(6));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0.00');
    }
  };

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const formatAddress = (address: string | { toString(): string } | undefined | null): string => {
    if (!address) return 'Unknown';
    const addressString = typeof address === 'string' ? address : address.toString();
    return `${addressString.slice(0, 6)}...${addressString.slice(-4)}`;
  };

  if (connected && account) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">
            {formatAddress(account.address)}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatAddress(account.address)}
                  </p>
                  <p className="text-sm text-gray-500">Connected</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">APT Balance</span>
                <span className="font-semibold">{balance} APT</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-500 text-sm">≈ USDC</span>
                <span className="text-gray-500 text-sm">{balance} USDC</span>
              </div>
            </div>
            
            <div className="p-2">
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Wallet className="w-4 h-4" />
        <span className="text-sm font-medium">Connect</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">Connect Wallet</h3>
            <p className="text-sm text-gray-600">Choose your preferred wallet</p>
          </div>
          
          <div className="p-2">
            {wallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleConnect(wallet.name)}
                className="w-full flex items-center space-x-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <img
                  src={wallet.icon}
                  alt={wallet.name}
                  className="w-8 h-8 rounded-lg"
                />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{wallet.name}</p>
                  <p className="text-sm text-gray-500">Connect with {wallet.name}</p>
                </div>
              </button>
            ))}
          </div>
          
          {wallets.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-gray-500 text-sm">No wallets detected</p>
              <p className="text-gray-400 text-xs mt-1">
                Please install a compatible Aptos wallet
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Backdrop */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}