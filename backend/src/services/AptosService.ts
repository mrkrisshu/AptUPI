import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

export class AptosService {
  private aptos: Aptos;
  private escrowAccount: Account;

  constructor() {
    const config = new AptosConfig({ 
      network: Network.TESTNET // Use testnet for demo
    });
    this.aptos = new Aptos(config);
    
    // Initialize escrow account from private key
    const privateKey = new Ed25519PrivateKey(process.env.APTOS_ESCROW_PRIVATE_KEY || '');
    this.escrowAccount = Account.fromPrivateKey({ privateKey });
  }

  async verifyTransaction(transactionHash: string): Promise<boolean> {
    try {
      const transaction = await this.aptos.getTransactionByHash({ transactionHash });
      
      if (!transaction) {
        return false;
      }

      // Verify transaction is successful and involves our escrow address
      return transaction.success && 
             this.isTransactionToEscrow(transaction);
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  }

  async getAccountBalance(accountAddress: string, coinType: string = '0x1::aptos_coin::AptosCoin'): Promise<number> {
    try {
      const resources = await this.aptos.getAccountResources({ accountAddress });
      const coinStore = resources.find(r => r.type === `0x1::coin::CoinStore<${coinType}>`);
      
      if (!coinStore) {
        return 0;
      }

      const balance = (coinStore.data as any).coin.value;
      return parseInt(balance) / 100000000; // Convert from octas to APT
    } catch (error) {
      console.error('Error getting account balance:', error);
      return 0;
    }
  }

  async getUSDCBalance(accountAddress: string): Promise<number> {
    // USDC coin type on Aptos testnet (this would be different on mainnet)
    const usdcCoinType = '0x498d8926f16eb9ca90cab1b3a26aa6f97a080b3fcbe6e83ae150b7243a00fb68::usdc::USDC';
    return this.getAccountBalance(accountAddress, usdcCoinType);
  }

  async listenToPaymentEvents(callback: (event: any) => void): Promise<void> {
    // This would implement event listening for payment confirmations
    // For demo purposes, we'll use polling instead of real-time events
    console.log('Starting to listen for payment events...');
    
    setInterval(async () => {
      try {
        // Poll for recent transactions to escrow account
        const transactions = await this.aptos.getAccountTransactions({
          accountAddress: this.escrowAccount.accountAddress.toString(),
          options: { limit: 10 }
        });

        // Process new transactions
        for (const tx of transactions) {
          if (this.isPaymentTransaction(tx)) {
            callback(tx);
          }
        }
      } catch (error) {
        console.error('Error polling for events:', error);
      }
    }, 5000); // Poll every 5 seconds
  }

  private isTransactionToEscrow(transaction: any): boolean {
    // Check if transaction involves transfer to escrow address
    const escrowAddress = this.escrowAccount.accountAddress.toString();
    
    // This is a simplified check - in production, you'd want more robust verification
    return transaction.payload && 
           JSON.stringify(transaction.payload).includes(escrowAddress);
  }

  private isPaymentTransaction(transaction: any): boolean {
    // Check if this is a payment transaction we care about
    return transaction.success && 
           transaction.payload?.function?.includes('transfer') &&
           this.isTransactionToEscrow(transaction);
  }

  getEscrowAddress(): string {
    return this.escrowAccount.accountAddress.toString();
  }

  async getTransactionDetails(transactionHash: string): Promise<any> {
    try {
      return await this.aptos.getTransactionByHash({ transactionHash });
    } catch (error) {
      console.error('Error getting transaction details:', error);
      return null;
    }
  }
}