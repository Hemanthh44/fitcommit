const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { initDB, checkDbHealth } = require('./config/db');
const { seedDatabase } = require('./seed/seedData');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// 1. HTTP Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// 2. Production-Ready CORS Configuration
const allowedOrigins = [];

if (process.env.FRONTEND_URL) {
  // Support comma-separated URLs or single URL (strip trailing slashes)
  process.env.FRONTEND_URL.split(',').forEach(url => {
    const trimmed = url.trim().replace(/\/$/, '');
    if (trimmed) allowedOrigins.push(trimmed);
  });
}

// In local development, always allow common localhost origins
if (!isProduction) {
  allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000');
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server, mobile app, Postman, or curl requests with no origin
    if (!origin) return callback(null, true);

    if (!isProduction) {
      // In development, allow localhost or explicitly declared origin
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Request origin: ${origin} not in allowed list: ${allowedOrigins.join(', ')}`);
      return callback(new Error('Not allowed by FitCommit CORS Policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Body Parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Rate Limiting for Sensitive Endpoints
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 auth attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

const gymCheckInLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 check-ins/minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate limit exceeded for gym entrance portal. Please try again in a moment.'
  }
});

// Apply rate limiters to sensitive routes
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api/gym/check-in', gymCheckInLimiter);

// 5. Standard Deployment Health Check Endpoints
app.get('/health', async (req, res) => {
  const dbHealth = await checkDbHealth();
  const isHealthy = dbHealth.healthy;
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    database: isHealthy ? 'connected' : 'disconnected',
    dbType: dbHealth.type,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

app.get('/api/health', async (req, res) => {
  const dbHealth = await checkDbHealth();
  res.json({
    status: 'ONLINE',
    system: 'FitCommit Production Architecture API',
    version: '2.1.0',
    database: dbHealth.healthy ? 'connected' : 'disconnected',
    dbType: dbHealth.type,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 6. Application API Routes
app.use('/api', apiRoutes);

// 7. 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// 8. Centralized Production Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[FitCommit API Error]', err.message || err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: isProduction && statusCode === 500 ? 'Internal Server Error' : (err.message || 'An unexpected error occurred'),
    message: isProduction && statusCode === 500 ? 'Internal Server Error' : (err.message || 'An unexpected error occurred'),
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// 9. Server Initialization
async function startServer() {
  try {
    await initDB();

    // In production, seed only if explicitly requested (RUN_SEED=true)
    const shouldSeed = process.env.RUN_SEED === 'true' || !isProduction;
    if (shouldSeed) {
      await seedDatabase();
    } else {
      console.log('[Database] Production mode active: Skipping automatic database seeding.');
    }

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` FitCommit Production API Server running on port ${PORT}`);
      console.log(` Environment:   ${process.env.NODE_ENV || 'development'}`);
      console.log(` Health Check:  http://localhost:${PORT}/health`);
      console.log(` API Endpoint:  http://localhost:${PORT}/api`);
      console.log(` CORS Allowed:  ${allowedOrigins.join(', ') || 'all (dev mode)'}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal Server Boot Error:', err);
    process.exit(1);
  }
}

startServer();
