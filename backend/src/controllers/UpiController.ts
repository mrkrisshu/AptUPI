import { Request, Response, NextFunction } from 'express';
import { UpiService } from '../services/UpiService';
import { PaymentService } from '../services/PaymentService';
import { createError } from '../middleware/errorHandler';

export class UpiController {
  private upiService: UpiService;
  private paymentService: PaymentService;

  constructor() {
    this.upiService = new UpiService();
    this.paymentService = new PaymentService();
  }

  initiateUpiPayout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { transactionId, merchantUpiId, amountINR } = req.body;

      if (!transactionId || !merchantUpiId || !amountINR) {
        throw createError('Missing required fields', 400);
      }

      // Verify payment exists and is confirmed
      const payment = await this.paymentService.getPaymentById(transactionId);
      
      if (!payment) {
        throw createError('Payment not found', 404);
      }

      if (payment.status !== 'confirmed') {
        throw createError('Payment not confirmed yet', 400);
      }

      // Initiate UPI payout
      const payout = await this.upiService.initiatePayout({
        transactionId,
        merchantUpiId,
        amount: amountINR,
        currency: 'INR'
      });

      // Update payment with payout info
      await this.paymentService.updatePaymentPayout(transactionId, payout.payoutId);

      res.json({
        success: true,
        data: {
          payoutId: payout.payoutId,
          status: payout.status,
          message: 'UPI payout initiated successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getUpiPayoutStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { payoutId } = req.params;
      
      const payoutStatus = await this.upiService.getPayoutStatus(payoutId);
      
      if (!payoutStatus) {
        throw createError('Payout not found', 404);
      }

      res.json({
        success: true,
        data: payoutStatus
      });
    } catch (error) {
      next(error);
    }
  };

  handleUpiWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { payoutId, status, transactionId } = req.body;

      // Verify webhook signature (implement based on UPI provider)
      // const isValidSignature = this.upiService.verifyWebhookSignature(req);
      // if (!isValidSignature) {
      //   throw createError('Invalid webhook signature', 401);
      // }

      // Update payment status based on UPI payout status
      let paymentStatus = 'pending';
      if (status === 'SUCCESS') {
        paymentStatus = 'completed';
      } else if (status === 'FAILED') {
        paymentStatus = 'failed';
      }

      await this.paymentService.updatePaymentStatus(transactionId, paymentStatus);

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}