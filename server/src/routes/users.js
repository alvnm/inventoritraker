const express = require('express');
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ────────────────────────────────────────────────
// GET /api/users/search?q= — buscar usuarios por nombre (para DMs)
// ────────────────────────────────────────────────
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ users: [] });
    const users = await prisma.user.findMany({
      where: { username: { contains: q, mode: 'insensitive' } },
      select: { id: true, username: true, role: true },
      take: 10,
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
