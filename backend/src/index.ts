import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';

// Routes
import apiRouter from '@/routes/index';

// Middlewares
import { errorHandler } from '@/middleware/errorHandler';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// =============================================================================
// MIDDLEWARES GLOBAUX
// =============================================================================

// Sécurité
app.use(helmet());

// CORS - Configuration pour le développement local
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://onboarding.ai'] // À ajuster selon votre domaine de prod
    : ['http://localhost:3000'], // Frontend Nuxt en dev
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan('combined'));

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'onboarding-backend'
  });
});

// API Routes
app.use('/api', apiRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use(errorHandler);

// =============================================================================
// SERVER STARTUP
// =============================================================================

const startServer = async () => {
  try {
    // Test connexion base de données
    await prisma.$connect();
    console.log('✅ Connexion PostgreSQL établie');

    // Démarrage serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Erreur au démarrage:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();