require('dotenv').config();

const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    recoverySecret: process.env.JWT_RECOVERY_SECRET || 'dev-recovery-secret-change-me',
    accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30),
  },
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
};

module.exports = config;
