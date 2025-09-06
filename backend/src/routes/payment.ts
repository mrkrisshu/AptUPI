import express from 'express';
import { PaymentController } from '../controllers/PaymentController';

const router = express.Router();
const paymentController = new PaymentController();

// POST /api/payment/initiate - Initiate payment
router.post('/initiate', paymentController.initiatePayment);

// GET /api/payment/status/:transactionId - Get payment status
router.get('/status/:transactionId', paymentController.getPaymentStatus);

// POST /api/payment/confirm - Confirm payment from blockchain
router.post('/confirm', paymentController.confirmPayment);

// GET /api/payment/history/:walletAddress - Get payment history
router.get('/history/:walletAddress', paymentController.getPaymentHistory);

export default router;