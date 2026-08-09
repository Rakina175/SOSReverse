import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security configuration using Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://api.dicebear.com"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

const isTest = process.env.PORT === '5050';

// General Rate Limiting to prevent DOS
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 200, // Limit each IP to 200 requests per window
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', generalLimiter);

// Strict Rate Limiting for sensitive auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 15, // Limit each IP to 15 login/register requests per window
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const mailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 5, // Limit reset-password/resend requests to 5 per window to prevent email flooding
  message: { message: 'Too many email requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Import Routes
import authRoutes from './routes/auth.js';
import contactRoutes from './routes/contacts.js';
import emergencyRoutes from './routes/emergencies.js';
import chatRoutes from './routes/chats.js';

// Mount routes with appropriate rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', mailLimiter);
app.use('/api/auth/resend-verification', mailLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/chats', chatRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error('[Error Middleware]', err.message || err);
  res.status(500).json({ message: 'An internal server error occurred' });
});

// Bind and Listen
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Security Server] Reverse SOS secure backend listening on port ${PORT}`);
});

export { app, server };
