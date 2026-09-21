const express = require('express');
const prisma = require('../prisma');
const { authenticate, requireCharacterAccess } = require('../middleware/auth');

const router = express.Router();

// ────────────────────────────────────────────────
// GET /api/logs/:characterId — historial de cambios del inventario
// ────────────────────────────────────────────────
router.get('/:characterId', authenticate, requireCharacterAccess, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const logs = await prisma.inventoryLog.findMany({
      where: { characterId: req.character.id },
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        detail: l.detail,
        by: l.user?.username || 'desconocido',
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
