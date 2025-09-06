import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/PaymentService';
import { AptosService } from '../services/AptosService';
import { OracleService } from '../services/OracleService';
import { createError } from '../middleware/errorHandler';

export class PaymentController {
  private paymentService: PaymentService;
  private aptosService: AptosService;
  private oracleService: OracleService;

  constructor() {
    this.paymentService = new PaymentService();
    this.aptosService = new AptosService();
    this.oracleService = new OracleService();
  }

  initiatePayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { merchantId, amountINR, walletAddress, merchantUpiId } = req.body;

      if (!merchantId || !amountINR || !walletAddress || !merchantUpiId) {
        throw createError('Missing required fields', 400);
      }

      // Get current exchange rate
      const exchangeRate = await this.oracleService.getExchangeRate('USDC', 'INR');
      const stablecoinAmount = amountINR / exchangeRate;

      // Create payment record
      const payment = await this.paymentService.createPayment({
        merchantId,
        amountINR,
        stablecoinAmount,
        exchangeRate,
        walletAddress,
        merchantUpiId,
        status: 'pending'
      });

      res.json({
        success: true,
        data: {
          transactionId: payment.id,
          amountINR,
          stablecoinAmount,
          exchangeRate,
          escrowAddress: process.env.APTOS_ESCROW_ADDRESS
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { transactionId } = req.params;
      
      const payment = await this.paymentService.getPaymentById(transactionId);
      
      if (!payment) {
        throw createError('Payment not found', 404);
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  };

  confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { transactionId, aptosTransactionHash } = req.body;

      if (!transactionId || !aptosTransactionHash) {
        throw createError('Missing required fields', 400);
      }

      // Verify transaction on Aptos blockchain
      const isValid = await this.aptosService.verifyTransaction(aptosTransactionHash);
      
      if (!isValid) {
        throw createError('Invalid transaction', 400);
      }

      // Update payment status
      const payment = await this.paymentService.updatePaymentStatus(transactionId, 'confirmed', aptosTransactionHash);

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  };

  getPaymentHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { walletAddress } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const payments = await this.paymentService.getPaymentHistory(
        walletAddress,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      next(error);
    }
  };
}