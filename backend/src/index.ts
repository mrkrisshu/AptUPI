import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import paymentRoutes from './routes/payment';
import upiRoutes from './routes/upi';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AptPay Backend Server is running' });
});

// API Routes
app.use('/api/payment', paymentRoutes);
app.use('/api/upi', upiRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 AptPay Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;