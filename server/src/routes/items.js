const express = require('express');
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = ['WEAPONS', 'ARMOR', 'POTIONS', 'MAGIC_ITEMS', 'TOOLS', 'FOOD', 'MATERIALS', 'MISC'];
const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'VERY_RARE', 'LEGENDARY'];

function validateItemPayload(b, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || b.name !== undefined) {
    if (!b.name || typeof b.name !== 'string' || !b.name.trim()) errors.push('El nombre es obligatorio');
    else data.name = b.name.trim();
  }
  if (b.description !== undefined && typeof b.description === 'string') data.description = b.description.trim();
  if (b.category !== undefined) {
    if (!CATEGORIES.includes(b.category)) errors.push('Categoría inválida');
    else data.category = b.category;
  }
  if (b.rarity !== undefined) {
    if (!RARITIES.includes(b.rarity)) errors.push('Rareza inválida');
    else data.rarity = b.rarity;
  }
  if (b.weight !== undefined) {
    const w = Number(b.weight);
    if (!Number.isFinite(w) || w < 0) errors.push('Peso inválido');
    else data.weight = w;
  }
  if (b.value !== undefined) {
    const v = Number(b.value);
    if (!Number.isFinite(v) || v < 0) errors.push('Valor inválido');
    else data.value = v;
  }
  if (b.equippable !== undefined) data.equippable = Boolean(b.equippable);
  if (b.imageUrl !== undefined && typeof b.imageUrl === 'string') data.imageUrl = b.imageUrl.trim() || null;

  return { errors, data };
}

// ────────────────────────────────────────────────
// GET /api/items — biblioteca global + objetos propios
// ────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, category, rarity, onlyMine } = req.query;

    const where = {
      OR: [{ isLibrary: true }, { ownerId: req.userId }],
    };
    if (search) where.name = { contains: String(search), mode: 'insensitive' };
    if (category && CATEGORIES.includes(category)) where.category = category;
    if (rarity && RARITIES.includes(rarity)) where.rarity = rarity;
    if (onlyMine === 'true') where.OR = [{ ownerId: req.userId }];

    const items = await prisma.item.findMany({
      where,
      orderBy: [{ isLibrary: 'desc' }, { name: 'asc' }],
      include: { owner: { select: { username: true } } },
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// GET /api/items/:id — detalle de un objeto
// ────────────────────────────────────────────────
router.get('/:id', authenticate, async (itemReq, res, next) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: itemReq.params.id },
      include: { owner: { select: { username: true } } },
    });
    if (!item) return res.status(404).json({ error: 'Objeto no encontrado' });
    if (!item.isLibrary && item.ownerId !== itemReq.userId) {
      return res.status(403).json({ error: 'No tienes acceso a este objeto' });
    }
    res.json({ item });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// POST /api/items — crear objeto personalizado (opcionalmente a la biblioteca personal)
// ────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const b = req.body || {};
    const { errors, data } = validateItemPayload(b);
    if (errors.length) return res.status(400).json({ error: errors.join('. ') });

    const item = await prisma.item.create({
      data: { ...data, isLibrary: false, ownerId: req.userId },
    });
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// PATCH /api/items/:id — actualizar objeto propio
// ────────────────────────────────────────────────
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const item = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Objeto no encontrado' });
    if (item.isLibrary || item.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Solo puedes editar tus propios objetos personalizados' });
    }
    const { errors, data } = validateItemPayload(req.body || {}, { partial: true });
    if (errors.length) return res.status(400).json({ error: errors.join('. ') });

    const updated = await prisma.item.update({ where: { id: item.id }, data });
    res.json({ item: updated });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// DELETE /api/items/:id — eliminar objeto propio
// ────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const item = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Objeto no encontrado' });
    if (item.isLibrary || item.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Solo puedes eliminar tus propios objetos personalizados' });
    }
    await prisma.item.delete({ where: { id: item.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
