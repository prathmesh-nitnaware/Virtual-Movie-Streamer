const cors = require('cors');
const config = require('../config');

const corsHandler = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = config.CLIENT_ORIGINS.some(
      (allowed) => origin === allowed || allowed === '*' || origin.endsWith('.vercel.app')
    );
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback allow in dev
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
});

module.exports = corsHandler;
