import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface Payment {
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

export interface CreatePaymentData {
  merchantId: string;
  amountINR: number;
  stablecoinAmount: number;
  exchangeRate: number;
  walletAddress: string;
  merchantUpiId: string;
  status: string;
}

export class PaymentService {
  private db: Pool;

  constructor() {
    this.db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'aptpay',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    });
  }

  async createPayment(data: CreatePaymentData): Promise<Payment> {
    const id = uuidv4();
    const now = new Date();

    const query = `
      INSERT INTO payments (
        id, merchant_id, amount_inr, stablecoin_amount, exchange_rate,
        wallet_address, merchant_upi_id, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      id,
      data.merchantId,
      data.amountINR,
      data.stablecoinAmount,
      data.exchangeRate,
      data.walletAddress,
      data.merchantUpiId,
      data.status,
      now,
      now
    ];

    const result = await this.db.query(query, values);
    return this.mapRowToPayment(result.rows[0]);
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    const query = 'SELECT * FROM payments WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToPayment(result.rows[0]);
  }

  async updatePaymentStatus(
    id: string,
    status: string,
    aptosTransactionHash?: string
  ): Promise<Payment> {
    const now = new Date();
    let query = 'UPDATE payments SET status = $1, updated_at = $2';
    let values = [status, now];
    
    if (aptosTransactionHash) {
      query += ', aptos_transaction_hash = $3';
      values.push(aptosTransactionHash);
    }
    
    query += ' WHERE id = $' + (values.length + 1) + ' RETURNING *';
    values.push(id);

    const result = await this.db.query(query, values);
    return this.mapRowToPayment(result.rows[0]);
  }

  async updatePaymentPayout(id: string, upiPayoutId: string): Promise<Payment> {
    const now = new Date();
    const query = `
      UPDATE payments 
      SET upi_payout_id = $1, updated_at = $2 
      WHERE id = $3 
      RETURNING *
    `;
    
    const result = await this.db.query(query, [upiPayoutId, now, id]);
    return this.mapRowToPayment(result.rows[0]);
  }

  async getPaymentHistory(
    walletAddress: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ payments: Payment[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    
    // Get total count
    const countQuery = 'SELECT COUNT(*) FROM payments WHERE wallet_address = $1';
    const countResult = await this.db.query(countQuery, [walletAddress]);
    const total = parseInt(countResult.rows[0].count);
    
    // Get payments
    const query = `
      SELECT * FROM payments 
      WHERE wallet_address = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.db.query(query, [walletAddress, limit, offset]);
    const payments = result.rows.map(row => this.mapRowToPayment(row));
    
    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  private mapRowToPayment(row: any): Payment {
    return {
      id: row.id,
      merchantId: row.merchant_id,
      amountINR: parseFloat(row.amount_inr),
      stablecoinAmount: parseFloat(row.stablecoin_amount),
      exchangeRate: parseFloat(row.exchange_rate),
      walletAddress: row.wallet_address,
      merchantUpiId: row.merchant_upi_id,
      status: row.status,
      aptosTransactionHash: row.aptos_transaction_hash,
      upiPayoutId: row.upi_payout_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}