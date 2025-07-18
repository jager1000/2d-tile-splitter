import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { APP_CONFIG } from './constants';
import { tileRoutes } from './routes/tiles';
import { mapRoutes } from './routes/maps';
import { errorHandler } from './middleware/errorHandler';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const app = express();
// Root route handler
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Map Generator API',
    docs: '/api-docs',
    health: '/health'
  });
});

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Map Generator API',
      version: '1.0.0',
      description: 'API documentation for Map Generator backend',
    },
  },
  apis: ['./routes/*.ts'], // Path to API docs
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true,
}));

// Compression
app.use(compression());

// Logging
app.use(morgan(APP_CONFIG.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: APP_CONFIG.NODE_ENV,
  });
});

// API routes
app.use('/api/tiles', tileRoutes);
app.use('/api/maps', mapRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = APP_CONFIG.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${APP_CONFIG.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
});

export default app;
