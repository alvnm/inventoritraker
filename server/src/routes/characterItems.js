const express = require('express');
const prisma = require('../prisma');
const { authenticate, requireCharacterAccess } = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = ['WEAPONS', 'ARMOR', 'POTIONS', 'MAGIC_ITEMS', 'TOOLS', 'FOOD', 'MATERIALS', 'MISC'];
const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'VERY_RARE', 'LEGENDARY'];

function logAction(req, characterId, action, detail) {
  return prisma.inventoryLog.create({
    data: { characterId, userId: req.userId, action, detail },
  }).catch(() => {});
}

// ────────────────────────────────────────────────
// GET /api/character-items/:characterId — inventario de un personaje
// ────────────────────────────────────────────────
router.get('/:characterId', authenticate, requireCharacterAccess, async (req, res, next) => {
  try {
    const items = await prisma.characterItem.findMany({
      where: { characterId: req.character.id },
      include: { item: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ items, canEdit: req.canEdit });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// POST /api/character-items/:characterId — agregar objeto (por itemId de biblioteca o payload de objeto custom)
// Body: { itemId, quantity?, equipped?, notes? }  ó  { customItem: {...}, quantity?, notes? }
// ────────────────────────────────────────────────
router.post('/:characterId', authenticate, requireCharacterAccess, async (req, res, next) => {
  try {
    if (!req.canEdit) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este inventario' });
    }
    const b = req.body || {};
    let itemId = b.itemId;
    let quantity = Number.isInteger(b.quantity) && b.quantity > 0 ? b.quantity : 1;
    const notes = typeof b.notes === 'string' && b.notes.trim() ? b.notes.trim() : null;
    const equipped = Boolean(b.equipped);

    // Objeto personalizado creado al vuelo: se guarda como objeto del usuario y se referencia
    if (!itemId && b.customItem && typeof b.customItem === 'object') {
      const c = b.customItem;
      if (!c.name || typeof c.name !== 'string') {
        return res.status(400).json({ error: 'El objeto personalizado necesita nombre' });
      }
      const created = await prisma.item.create({
        data: {
          name: c.name.trim(),
          description: typeof c.description === 'string' ? c.description.trim() : null,
          category: CATEGORIES.includes(c.category) ? c.category : 'MISC',
          rarity: RARITIES.includes(c.rarity) ? c.rarity : 'COMMON',
          weight: Number(c.weight) >= 0 ? Number(c.weight) : 0,
          value: Number(c.value) >= 0 ? Number(c.value) : 0,
          equippable: Boolean(c.equippable),
          imageUrl: typeof c.imageUrl === 'string' ? c.imageUrl : null,
          isLibrary: false,
          ownerId: req.userId,
        },
      });
      itemId = created.id;
    }

    if (!itemId) return res.status(400).json({ error: 'Falta itemId o customItem' });

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Objeto no encontrado en la biblioteca' });

    // Si ya existe en el inventario, sumar cantidad (evita duplicados)
    const existing = await prisma.characterItem.findUnique({
      where: { characterId_itemId: { characterId: req.character.id, itemId } },
    });

    let characterItem;
    if (existing) {
      characterItem = await prisma.characterItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity, notes: notes ?? existing.notes },
        include: { item: true },
      });
    } else {
      characterItem = await prisma.characterItem.create({
        data: { characterId: req.character.id, itemId, quantity, equipped, notes },
        include: { item: true },
      });
    }

    await logAction(req, req.character.id, 'ADD_ITEM', `${quantity}× ${item.name}`);
    res.status(201).json({ characterItem });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// PATCH /api/character-items/:characterId/:itemId — actualizar cantidad/notas/equipado
// Body: { quantity?, equipped?, notes? } (parcial)
// ────────────────────────────────────────────────
router.patch('/:characterId/:itemId', authenticate, requireCharacterAccess, async (req, res, next) => {
  try {
    if (!req.canEdit) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este inventario' });
    }
    const b = req.body || {};
    const data = {};

    if (b.quantity !== undefined) {
      const q = Number(b.quantity);
      if (!Number.isInteger(q) || q < 1) return res.status(400).json({ error: 'Cantidad inválida (mín. 1)' });
      data.quantity = q;
    }
    if (b.equipped !== undefined) data.equipped = Boolean(b.equipped);
    if (b.notes !== undefined) data.notes = typeof b.notes === 'string' ? b.notes.trim() || null : null;

    // Validar que el objeto sea equipable si se intenta equipar
    if (data.equipped === true) {
      const ci = await prisma.characterItem.findUnique({
        where: { characterId_itemId: { characterId: req.character.id, itemId: req.params.itemId } },
        include: { item: true },
      });
      if (!ci) return res.status(404).json({ error: 'El objeto no está en este inventario' });
      if (!ci.item.equippable) return res.status(400).json({ error: 'Este objeto no es equipable' });
    }

    const characterItem = await prisma.characterItem.update({
      where: { characterId_itemId: { characterId: req.character.id, itemId: req.params.itemId } },
      data,
      include: { item: true },
    });

    const action = data.equipped === true ? 'EQUIP_ITEM' : data.equipped === false ? 'UNEQUIP_ITEM' : 'UPDATE_ITEM';
    const detail =
      action === 'EQUIP_ITEM' || action === 'UNEQUIP_ITEM'
        ? `${characterItem.item.name}`
        : `${characterItem.item.name} (cantidad: ${characterItem.quantity})`;
    await logAction(req, req.character.id, action, detail);

    res.json({ characterItem });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// DELETE /api/character-items/:characterId/:itemId — quitar del inventario
// ────────────────────────────────────────────────
router.delete('/:characterId/:itemId', authenticate, requireCharacterAccess, async (req, res, next) => {
  try {
    if (!req.canEdit) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este inventario' });
    }
    const ci = await prisma.characterItem.findUnique({
      where: { characterId_itemId: { characterId: req.character.id, itemId: req.params.itemId } },
      include: { item: true },
    });
    if (!ci) return res.status(404).json({ error: 'El objeto no está en este inventario' });

    await prisma.characterItem.delete({ where: { id: ci.id } });
    await logAction(req, req.character.id, 'REMOVE_ITEM', `${ci.quantity}× ${ci.item.name}`);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// POST /api/character-items/:characterId/grant — el DM entrega un objeto a un personaje
// Body: { itemId, quantity? }
// ────────────────────────────────────────────────
router.post('/:characterId/grant', authenticate, requireCharacterAccess, async (req, res, next) => {
  try {
    // Solo el DM (no dueño del personaje) usa este endpoint; el dueño usa el POST normal.
    const isDmOfCampaign =
      req.character.campaignId && req.character.campaign && req.character.campaign.ownerId === req.userId;
    if (!isDmOfCampaign || req.character.ownerId === req.userId) {
      return res.status(403).json({ error: 'Este endpoint es solo para que el DM entregue objetos' });
    }

    const { itemId } = req.body || {};
    const quantity = Number.isInteger(req.body?.quantity) && req.body.quantity > 0 ? req.body.quantity : 1;
    if (!itemId) return res.status(400).json({ error: 'Falta itemId' });

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Objeto no encontrado en la biblioteca' });

    const existing = await prisma.characterItem.findUnique({
      where: { characterId_itemId: { characterId: req.character.id, itemId } },
    });

    if (existing) {
      await prisma.characterItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await prisma.characterItem.create({
        data: { characterId: req.character.id, itemId, quantity },
      });
    }

    await prisma.transferLog.create({
      data: { fromUserId: req.userId, toCharId: req.character.id, itemId, quantity, note: 'Entrega del DM' },
    });
    await logAction(req, req.character.id, 'DM_GRANT_ITEM', `El DM entregó ${quantity}× ${item.name}`);

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
