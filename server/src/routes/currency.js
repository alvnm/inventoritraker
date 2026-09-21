const express = require('express');
const prisma = require('../prisma');
const { authenticate, requireCharacterAccess } = require('../middleware/auth');
const { CP, toCopper } = require('../lib/currency');

const router = express.Router();

const COIN_FIELDS = ['platinum', 'gold', 'electrum', 'silver', 'copper'];

function logCurrency(req, characterId, detail) {
  return prisma.inventoryLog.create({
    data: { characterId, userId: req.userId, action: 'UPDATE_CURRENCY', detail },
  }).catch(() => {});
}

// ────────────────────────────────────────────────
// GET /api/currency/:characterId — bolsillos del personaje
// ────────────────────────────────────────────────
router.get('/:characterId', authenticate, requireCharacterAccess, async (req, res, next) => {
  try {
    const currency = await prisma.currency.upsert({
      where: { characterId: req.character.id },
      update: {},
      create: { characterId: req.character.id },
    });
    res.json({ currency, totalCopper: toCopper(currency), canEdit: req.canEdit });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// PATCH /api/currency/:characterId — ajustar monedas
// Body: { platinum?, gold?, electrum?, silver?, copper? }  → establece valores absolutos
//       ó { delta: { platinum?: +n/-n, ... } }             → ajuste relativo (nunca bajo 0)
// ────────────────────────────────────────────────
router.patch('/:characterId', authenticate, requireCharacterAccess, async (req, res, next) => {
  try {
    if (!req.canEdit) {
      return res.status(403).json({ error: 'No tienes permiso para modificar las monedas de este personaje' });
    }
    const b = req.body || {};

    await prisma.currency.upsert({
      where: { characterId: req.character.id },
      update: {},
      create: { characterId: req.character.id },
    });

    let data = {};
    const changes = [];

    if (b.delta && typeof b.delta === 'object') {
      const current = await prisma.currency.findUnique({ where: { characterId: req.character.id } });
      for (const f of COIN_FIELDS) {
        const d = Number(b.delta[f]);
        if (!Number.isInteger(d) || d === 0) continue;
        const next = Math.max(0, current[f] + d);
        if (next !== current[f]) {
          data[f] = next;
          changes.push(`${d > 0 ? '+' : ''}${d} ${f}`);
        }
      }
    } else {
      for (const f of COIN_FIELDS) {
        const v = b[f];
        if (v === undefined) continue;
        if (!Number.isInteger(Number(v)) || Number(v) < 0) {
          return res.status(400).json({ error: `Cantidad inválida para ${f}` });
        }
        if (Number(v) !== undefined) {
          data[f] = Number(v);
          changes.push(`${f}: ${Number(v)}`);
        }
      }
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({ error: 'No hay cambios de monedas que aplicar' });
    }

    const currency = await prisma.currency.update({
      where: { characterId: req.character.id },
      data,
    });
    await logCurrency(req, req.character.id, changes.join(', '));
    res.json({ currency, totalCopper: toCopper(currency) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
