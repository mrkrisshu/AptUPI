'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { ReactNode } from 'react';

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.TESTNET, // Use testnet for development
      }}
      onError={(error) => {
        console.error('Wallet connection error:', error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}