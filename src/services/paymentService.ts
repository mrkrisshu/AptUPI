'use client';

interface CreatePaymentData {
  merchantId: string;
  amountINR: number;
  walletAddress: string;
  merchantUpiId: string;
}

interface Payment {
  id: string;
  merchantId: string;
  amountINR: number;
  stablecoinAmount: number;
  exchangeRate: number;
  walletAddress: string;
  merchantUpiId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'failed';
  aptosTransactionHash?: string;
  upiPayoutId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UPIPayoutData {
  paymentId: string;
  upiId: string;
  amount: number;
  merchantName: string;
}

class PaymentService {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  async createPayment(data: CreatePaymentData): Promise<Payment> {
    const response = await fetch(`${this.baseURL}/payment/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment');
    }

    const result = await response.json();
    return result.data;
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    const response = await fetch(`${this.baseURL}/payment/status/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to get payment');
    }

    const result = await response.json();
    return result.data;
  }

  async updatePaymentStatus(
    id: string,
    status: string,
    aptosTransactionHash?: string
  ): Promise<Payment> {
    const response = await fetch(`${this.baseURL}/payment/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId: id,
        status,
        aptosTransactionHash,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update payment status');
    }

    const result = await response.json();
    return result.data;
  }

  async initiateUPIPayout(data: UPIPayoutData): Promise<any> {
    const response = await fetch(`${this.baseURL}/upi/payout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId: data.paymentId,
        merchantUpiId: data.upiId,
        amountINR: data.amount,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to initiate UPI payout');
    }

    const result = await response.json();
    return result.data;
  }

  async getPaymentHistory(
    walletAddress: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await fetch(
      `${this.baseURL}/payment/history/${walletAddress}?page=${page}&limit=${limit}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get payment history');
    }

    const result = await response.json();
    return result.data;
  }
}

export const paymentService = new PaymentService();
export default paymentService;