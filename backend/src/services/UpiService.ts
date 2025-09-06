import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface UpiPayoutRequest {
  transactionId: string;
  merchantUpiId: string;
  amount: number;
  currency: string;
}

export interface UpiPayoutResponse {
  payoutId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  message: string;
  transactionId?: string;
}

export interface UpiPayoutStatus {
  payoutId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  amount: number;
  merchantUpiId: string;
  transactionId?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UpiService {
  private baseUrl: string;
  private apiKey: string;
  private secretKey: string;

  constructor() {
    // Using Cashfree sandbox for demo
    this.baseUrl = process.env.UPI_SANDBOX_URL || 'https://sandbox.cashfree.com/pg';
    this.apiKey = process.env.UPI_API_KEY || 'demo_api_key';
    this.secretKey = process.env.UPI_SECRET_KEY || 'demo_secret_key';
  }

  async initiatePayout(request: UpiPayoutRequest): Promise<UpiPayoutResponse> {
    try {
      const payoutId = uuidv4();
      
      // For demo purposes, we'll simulate the UPI payout
      if (process.env.NODE_ENV === 'development' || process.env.USE_UPI_MOCK === 'true') {
        return this.mockUpiPayout(request, payoutId);
      }

      // Real UPI payout implementation
      const payoutData = {
        payout_id: payoutId,
        amount: request.amount,
        currency: request.currency,
        beneficiary: {
          upi_id: request.merchantUpiId,
          name: 'Merchant Name' // In production, get from merchant data
        },
        purpose: 'PAYMENT',
        remarks: `AptPay payment for transaction ${request.transactionId}`
      };

      const response = await axios.post(
        `${this.baseUrl}/payouts`,
        payoutData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-Client-Secret': this.secretKey
          },
          timeout: 30000
        }
      );

      return {
        payoutId,
        status: response.data.status || 'PENDING',
        message: 'Payout initiated successfully',
        transactionId: response.data.transaction_id
      };
    } catch (error) {
      console.error('Error initiating UPI payout:', error);
      
      return {
        payoutId: uuidv4(),
        status: 'FAILED',
        message: 'Failed to initiate payout'
      };
    }
  }

  async getPayoutStatus(payoutId: string): Promise<UpiPayoutStatus | null> {
    try {
      // For demo purposes, simulate status check
      if (process.env.NODE_ENV === 'development' || process.env.USE_UPI_MOCK === 'true') {
        return this.mockPayoutStatus(payoutId);
      }

      const response = await axios.get(
        `${this.baseUrl}/payouts/${payoutId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Client-Secret': this.secretKey
          },
          timeout: 10000
        }
      );

      const data = response.data;
      
      return {
        payoutId,
        status: data.status,
        amount: data.amount,
        merchantUpiId: data.beneficiary.upi_id,
        transactionId: data.transaction_id,
        failureReason: data.failure_reason,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error getting payout status:', error);
      return null;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implement webhook signature verification based on UPI provider
    // This is a simplified version for demo
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(payload)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  private mockUpiPayout(request: UpiPayoutRequest, payoutId: string): UpiPayoutResponse {
    // Simulate different outcomes for demo
    const random = Math.random();
    
    if (random < 0.8) {
      // 80% success rate
      return {
        payoutId,
        status: 'PENDING',
        message: 'Mock payout initiated successfully',
        transactionId: `mock_txn_${Date.now()}`
      };
    } else {
      // 20% failure rate for demo
      return {
        payoutId,
        status: 'FAILED',
        message: 'Mock payout failed - insufficient balance'
      };
    }
  }

  private mockPayoutStatus(payoutId: string): UpiPayoutStatus {
    // Simulate status progression
    const random = Math.random();
    const now = new Date();
    
    return {
      payoutId,
      status: random < 0.7 ? 'SUCCESS' : (random < 0.9 ? 'PENDING' : 'FAILED'),
      amount: 100, // Mock amount
      merchantUpiId: 'merchant@upi',
      transactionId: `mock_txn_${Date.now()}`,
      failureReason: random >= 0.9 ? 'Insufficient balance' : undefined,
      createdAt: new Date(now.getTime() - 60000), // 1 minute ago
      updatedAt: now
    };
  }

  async getBeneficiaryDetails(upiId: string): Promise<any> {
    // Verify UPI ID and get beneficiary details
    try {
      if (process.env.NODE_ENV === 'development' || process.env.USE_UPI_MOCK === 'true') {
        return {
          upiId,
          name: 'Mock Merchant',
          verified: true
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/verification/upi`,
        { upi_id: upiId },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Client-Secret': this.secretKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error verifying UPI ID:', error);
      return null;
    }
  }
}