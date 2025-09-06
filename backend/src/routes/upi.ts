import express from 'express';
import { UpiController } from '../controllers/UpiController';

const router = express.Router();
const upiController = new UpiController();

// POST /api/upi/payout - Trigger UPI payout to merchant
router.post('/payout', upiController.initiateUpiPayout);

// GET /api/upi/status/:payoutId - Get UPI payout status
router.get('/status/:payoutId', upiController.getUpiPayoutStatus);

// POST /api/upi/webhook - Webhook for UPI status updates
router.post('/webhook', upiController.handleUpiWebhook);

export default router;