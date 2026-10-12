import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import shopRoutes from './routes/shopRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import resetRoutes from './routes/resetRoutes';
import profitLossRoutes from './routes/profitLossRoutes';
import expenseRoutes from './routes/expenseRoutes';
import supplierRoutes from './routes/supplierRoutes';
import billRoutes from './routes/billRoutes';
import { getAllBalances } from './controllers/shopController';
import { protect, adminOnly } from './middleware/auth';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Wholesale API is running', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', resetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/profit-loss', profitLossRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/bills', billRoutes);

// All balances (admin)
app.get('/api/balances', protect, adminOnly, getAllBalances);

// 404 & Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);

  // Cloudinary status
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret && cloudName !== 'your_cloud_name') {
    console.log(`☁️  Cloudinary: ✅ Configured (${cloudName})`);
  } else {
    console.log(`☁️  Cloudinary: ❌ Not configured — check .env`);
  }
  console.log('');
});

export default app;
