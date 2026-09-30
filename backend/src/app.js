const express = require('express');
const path = require('path');
const fs = require('fs');
const corsHandler = require('./middlewares/corsHandler');
const errorHandler = require('./middlewares/errorHandler');
const apiRoutes = require('./routes/api');
const logger = require('./utils/logger');

const app = express();

// Security and CORS
app.use(corsHandler);
app.use(express.json());

// Request logger in dev/debug
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Production Static Serving (Single-Container / Full-Stack Deployment)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  logger.info(`Serving production frontend bundle from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  // SPA fallback for all non-API GET requests (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
    next();
  });
}

// Global Error Handler
app.use(errorHandler);

module.exports = app;
