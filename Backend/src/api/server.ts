import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import datasetsRouter from './routes/datasets';
import manifestRouter from './routes/manifest';
import versionsRouter from './routes/versions';
import verifyRouter from './routes/verify';
import walrusRouter from './routes/walrus';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS configuration - allow all localhost origins in development
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    // Allow all localhost origins (any port) in development
    const isLocalhost = origin.startsWith('http://localhost:') || 
                       origin.startsWith('http://127.0.0.1:') ||
                       origin.includes('localhost');
    
    if (isLocalhost) {
      console.log(`✅ CORS: Allowing origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS: Blocked origin: ${origin}`);
      // Allow anyway in development (comment this line in production!)
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sirius-data-layer-api' });
});

// API Routes
app.use('/api/datasets', datasetsRouter);
app.use('/api/manifest', manifestRouter);
app.use('/api/versions', versionsRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/walrus', walrusRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
// Force start when executed via npm script (api:dev)
// In WSL/ts-node, require.main === module might not work correctly
console.log('🔍 Debug info:');
console.log('  require.main === module:', require.main === module);
console.log('  require.main?.filename:', require.main?.filename);
console.log('  process.argv[0]:', process.argv[0]);
console.log('  process.argv[1]:', process.argv[1]);
console.log('  __filename:', __filename);

// Always start the server when this file is run directly
// The server should stay alive because app.listen() keeps the event loop active
console.log('\n🚀 Starting server...');

try {
  const server = app.listen(PORT, () => {
      console.log(`🚀 Sirius Data Layer API running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation:`);
      console.log(`   GET  /api/datasets - List all datasets`);
      console.log(`   POST /api/datasets - Create a dataset`);
      console.log(`   GET  /api/datasets/:id - Get dataset by ID`);
      console.log(`   POST /api/manifest/entries - Add manifest entries`);
      console.log(`   GET  /api/manifest/entries?datasetId=... - Get entries`);
      console.log(`   GET  /api/versions?datasetId=... - List versions`);
      console.log(`   POST /api/versions/prepare - Prepare commit`);
      console.log(`   POST /api/versions - Create version`);
      console.log(`   POST /api/verify/chain - Verify chain`);
      console.log(`   POST /api/walrus/upload - Upload to Walrus`);
      console.log(`   GET  /api/walrus/status/:blobId - Get blob status`);
      console.log(`   GET  /api/walrus/download/:blobId - Download blob`);
      console.log(`   DELETE /api/walrus/burn/:blobId - Burn/Delete blob`);
      console.log(`\n✅ Server is listening and ready to accept requests...`);
      console.log(`💡 Press Ctrl+C to stop the server\n`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    // Keep process alive - this should not be necessary but helps debug
    console.log('💚 Process should stay alive. Event loop is active.');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }

export default app;

