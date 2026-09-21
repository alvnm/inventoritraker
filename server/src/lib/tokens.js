const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, username: user.username },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessTtl }
  );
}

function signRefresh(user) {
  return jwt.sign(
    { sub: user.id, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: `${config.jwt.refreshTtlDays}d` }
  );
}

function signRecovery(userId) {
  return jwt.sign({ sub: userId, type: 'recovery' }, config.jwt.recoverySecret, {
    expiresIn: '1h',
  });
}

function verifyRefresh(token) {
  const payload = jwt.verify(token, config.jwt.refreshSecret);
  if (payload.type !== 'refresh') throw new Error('Invalid token type');
  return payload;
}

function verifyRecovery(token) {
  const payload = jwt.verify(token, config.jwt.recoverySecret);
  if (payload.type !== 'recovery') throw new Error('Invalid token type');
  return payload;
}

function generateInviteCode() {
  // Código legible de 8 caracteres (sin caracteres ambiguos)
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) code += alphabet[bytes[i] % alphabet.length];
  return code;
}

module.exports = {
  signAccess,
  signRefresh,
  signRecovery,
  verifyRefresh,
  verifyRecovery,
  generateInviteCode,
};
