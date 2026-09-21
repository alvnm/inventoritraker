const express = require('express');
const cors = require('cors');
const config = require('./config');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const characterRoutes = require('./routes/characters');
const itemRoutes = require('./routes/items');
const characterItemRoutes = require('./routes/characterItems');
const currencyRoutes = require('./routes/currency');
const logRoutes = require('./routes/logs');
const usersRoutes = require('./routes/users');

const app = express();

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || config.corsOrigin.includes(origin) || config.corsOrigin.includes('*')) {
        return cb(null, true);
      }
      return cb(new Error('Origen no permitido por CORS'));
    },
  })
);
app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'dnd-inventory-tracker' }));

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/character-items', characterItemRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/users', usersRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
