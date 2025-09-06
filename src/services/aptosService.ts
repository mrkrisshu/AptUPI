import { Aptos, AptosConfig, Network, Account } from '@aptos-labs/ts-sdk';

class AptosService {
  private aptos: Aptos;
  private config: AptosConfig;

  constructor() {
    this.config = new AptosConfig({ network: Network.TESTNET });
    this.aptos = new Aptos(this.config);
  }

  /**
   * Get USDC balance for an account
   */
  async getUSDCBalance(accountAddress: string): Promise<number> {
    try {
      // For testnet, we'll use APT as a substitute for USDC
      // In production, this would be the actual USDC token address
      const balance = await this.aptos.getAccountAPTAmount({
        accountAddress,
      });
      
      // Convert from octas to APT (8 decimal places)
      return balance / 100000000;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  /**
   * Get account info
   */
  async getAccountInfo(accountAddress: string) {
    try {
      return await this.aptos.getAccountInfo({ accountAddress });
    } catch (error) {
      console.error('Error fetching account info:', error);
      return null;
    }
  }

  /**
   * Create a transfer transaction
   */
  async createTransferTransaction(senderAddress: string, recipientAddress: string, amount: number) {
    try {
      return await this.aptos.transferCoinTransaction({
        sender: senderAddress,
        recipient: recipientAddress,
        amount: Math.floor(amount * 100000000), // Convert to octas
      });
    } catch (error) {
      console.error('Error creating transfer transaction:', error);
      throw error;
    }
  }

  /**
   * Transfer APT (representing USDC in testnet)
   */
  async transferAPT(fromAccount: Account, toAddress: string, amount: number) {
    try {
      const transaction = await this.createTransferTransaction(
        fromAccount.accountAddress.toString(),
        toAddress,
        amount
      );

      const committedTransaction = await this.aptos.signAndSubmitTransaction({
        signer: fromAccount,
        transaction,
      });

      return committedTransaction;
    } catch (error) {
      console.error('Error transferring APT:', error);
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(transactionHash: string) {
    try {
      return await this.aptos.waitForTransaction({
        transactionHash,
      });
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionHash: string) {
    try {
      return await this.aptos.getTransactionByHash({
        transactionHash,
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction: unknown) {
    try {
      return await this.aptos.transaction.simulate.simple(transaction as any);
    } catch (error) {
      console.error('Error estimating gas:', error);
      return null;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice() {
    try {
      const estimate = await this.aptos.getGasPriceEstimation();
      return estimate.gas_estimate;
    } catch (error) {
      console.error('Error fetching gas price:', error);
      return 100; // Default gas price
    }
  }

  /**
   * Create a new account (for testing)
   */
  createAccount(): Account {
    return Account.generate();
  }

  /**
   * Fund account with test APT (testnet only)
   */
  async fundAccount(accountAddress: string, amount: number = 1) {
    try {
      await this.aptos.fundAccount({
        accountAddress,
        amount: amount * 100000000, // Convert to octas
      });
      return true;
    } catch (error) {
      console.error('Error funding account:', error);
      return false;
    }
  }

  /**
   * Get network info
   */
  async getNetworkInfo() {
    try {
      return await this.aptos.getLedgerInfo();
    } catch (error) {
      console.error('Error fetching network info:', error);
      return null;
    }
  }

  /**
   * Format address for display
   */
  formatAddress(address: string): string {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Validate address format
   */
  isValidAddress(address: string): boolean {
    try {
      // Basic validation - Aptos addresses are 32 bytes (64 hex chars) with 0x prefix
      const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
      return /^[0-9a-fA-F]{1,64}$/.test(cleanAddress);
    } catch {
      return false;
    }
  }

  /**
   * Convert amount to display format
   */
  formatAmount(amount: number, decimals: number = 8): string {
    return (amount / Math.pow(10, decimals)).toFixed(6);
  }

  /**
   * Convert display amount to blockchain format
   */
  parseAmount(amount: number, decimals: number = 8): number {
    return Math.floor(amount * Math.pow(10, decimals));
  }
}

export default new AptosService();
export { AptosService };