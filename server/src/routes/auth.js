const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');
const { signAccess, signRefresh, signRecovery, verifyRefresh, verifyRecovery } = require('../lib/tokens');

const router = express.Router();
const SALT_ROUNDS = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ────────────────────────────────────────────────
// POST /api/auth/register
// ────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body || {};

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' });
    }
    if (!EMAIL_RE.test(email || '')) {
      return res.status(400).json({ error: 'Correo electrónico inválido' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }
    if (role && role !== 'PLAYER' && role !== 'DM') {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: passwordHash,
        role: role || 'PLAYER',
      },
      select: { id: true, username: true, email: true, role: true },
    });

    res.status(201).json({
      user,
      accessToken: signAccess(user),
      refreshToken: signRefresh(user),
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'El usuario o correo ya está registrado' });
    }
    next(err);
  }
});

// ────────────────────────────────────────────────
// POST /api/auth/login
// ────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: String(email).toLowerCase() }, { username: email }],
      },
    });
    if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

    res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role, allowDmEdit: user.allowDmEdit },
      accessToken: signAccess(user),
      refreshToken: signRefresh(user),
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// POST /api/auth/refresh
// ────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: 'Falta refreshToken' });

    let payload;
    try {
      payload = verifyRefresh(refreshToken);
    } catch {
      return res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role, allowDmEdit: user.allowDmEdit },
      accessToken: signAccess(user),
      refreshToken: signRefresh(user),
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// POST /api/auth/logout
// ────────────────────────────────────────────────
router.post('/logout', authenticate, async (req, res, next) => {
  // Con JWT stateless, el logout lo hace el cliente descartando los tokens.
  // (Si se quisiera un denylist, se añadiría aquí.)
  res.json({ ok: true });
});

// ────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ────────────────────────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Falta el correo' });

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    // Responder genérico para no filtrar si el correo existe
    if (!user) {
      return res.json({
        ok: true,
        message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña.',
      });
    }

    const token = signRecovery(user.id);
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetExpires: expires },
    });

    // Sin SMTP configurado, devolvemos el enlace en la respuesta para poder usarlo en local.
    const resetUrl = `${config.frontendUrl}/#/reset-password?token=${token}`;
    res.json({
      ok: true,
      message: 'Enlace de recuperación generado.',
      resetUrl,
      expiresIn: '1h',
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// POST /api/auth/reset-password
// ────────────────────────────────────────────────
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ error: 'Faltan el token o la nueva contraseña' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    let payload;
    try {
      payload = verifyRecovery(token);
    } catch {
      return res.status(400).json({ error: 'Token de recuperación inválido o expirado' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.resetToken !== token || !user.resetExpires || user.resetExpires < new Date()) {
      return res.status(400).json({ error: 'Token de recuperación inválido o expirado' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash, resetToken: null, resetExpires: null },
    });

    res.json({ ok: true, message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// GET /api/auth/me
// ────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        allowDmEdit: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// PATCH /api/auth/me — actualizar perfil (username, allowDmEdit, avatar)
// ────────────────────────────────────────────────
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { username, allowDmEdit, avatarUrl } = req.body || {};
    const data = {};
    if (typeof username === 'string' && username.trim().length >= 3) data.username = username.trim();
    if (typeof allowDmEdit === 'boolean') data.allowDmEdit = allowDmEdit;
    if (typeof avatarUrl === 'string') data.avatarUrl = avatarUrl;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { id: true, username: true, email: true, role: true, allowDmEdit: true, avatarUrl: true },
    });
    res.json({ user });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' });
    next(err);
  }
});

// ────────────────────────────────────────────────
// PATCH /api/auth/me/password — cambiar contraseña (autenticado)
// ────────────────────────────────────────────────
router.patch('/me/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Se requieren la contraseña actual y la nueva (mín. 8 caracteres)' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id: req.userId }, data: { password: passwordHash } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
