// Entrypoint serverless para Vercel.
// Vercel empaqueta este archivo como función Node.js; el rewrite
// /api/(.*) -> /api/index de vercel.json dirige el tráfico aquí.
// La migración (prisma db push) y el seed se ejecutan en el build command.
const app = require('../server/src/app');

module.exports = app;
