const express = require('express');
const prisma = require('../prisma');
const { authenticate, requireCharacterAccess } = require('../middleware/auth');
const { toCopper } = require('../lib/currency');

const router = express.Router();

const STAT_FIELDS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

/** Peso total del inventario: suma de peso × cantidad (los equipados también pesan) */
function computeInventoryWeight(items) {
  return items.reduce((acc, ci) => acc + (ci.item?.weight || 0) * (ci.quantity || 0), 0);
}

/** Serializa un personaje con peso calculado y total de monedas */
function serializeCharacter(character) {
  const totalWeight = computeInventoryWeight(character.items || []);
  const currency = character.currency || { platinum: 0, gold: 0, electrum: 0, silver: 0, copper: 0 };
  const itemQuantity = (character.items || []).reduce((acc, ci) => acc + (ci.quantity || 0), 0);
  return {
    ...character,
    currentWeight: Math.round(totalWeight * 100) / 100,
    itemCount: (character.items || []).length,
    itemQuantity,
    currency,
    totalCopper: toCopper(currency),
  };
}

const characterInclude = {
  items: { include: { item: true } },
  currency: true,
  owner: { select: { id: true, username: true, allowDmEdit: true } },
  campaign: { select: { id: true, name: true } },
};

// ────────────────────────────────────────────────
// GET /api/characters — mis personajes (o todos si soy DM y pido ?campaignId=)
// ────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const where = { ownerId: req.userId };
    if (req.query.campaignId) where.campaignId = req.query.campaignId;

    const characters = await prisma.character.findMany({
      where,
      include: characterInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ characters: characters.map(serializeCharacter) });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// POST /api/characters — crear personaje
// ────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.name || typeof b.name !== 'string' || !b.name.trim()) {
      return res.status(400).json({ error: 'El nombre del personaje es obligatorio' });
    }

    // Si se indica campaña, validar membresía
    let campaignId = null;
    if (b.campaignId) {
      const membership = await prisma.campaignMember.findUnique({
        where: { campaignId_userId: { campaignId: b.campaignId, userId: req.userId } },
      });
      if (!membership) return res.status(403).json({ error: 'No perteneces a esa campaña' });
      campaignId = b.campaignId;
    }

    const data = {
      ownerId: req.userId,
      campaignId,
      name: b.name.trim(),
      className: typeof b.className === 'string' && b.className.trim() ? b.className.trim() : 'Aventurero',
      race: typeof b.race === 'string' && b.race.trim() ? b.race.trim() : 'Humano',
      level: Number.isInteger(b.level) && b.level >= 1 && b.level <= 20 ? b.level : 1,
      description: typeof b.description === 'string' ? b.description.trim() : null,
      avatarUrl: typeof b.avatarUrl === 'string' ? b.avatarUrl : null,
      maxCapacity: typeof b.maxCapacity === 'number' && b.maxCapacity > 0 ? b.maxCapacity : 15,
      currency: { create: {} },
    };
    for (const f of STAT_FIELDS) {
      if (Number.isInteger(b[f]) && b[f] >= 1 && b[f] <= 30) data[f] = b[f];
    }

    const character = await prisma.character.create({
      data,
      include: characterInclude,
    });
    res.status(201).json({ character: serializeCharacter(character) });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// GET /api/characters/campaign/:campaignId — personajes de la campaña (para el DM)
// ────────────────────────────────────────────────
router.get('/campaign/:campaignId', authenticate, async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return res.status(404).json({ error: 'Campaña no encontrada' });

    const isOwner = campaign.ownerId === req.userId;
    if (!isOwner) {
      const membership = await prisma.campaignMember.findUnique({
        where: { campaignId_userId: { campaignId, userId: req.userId } },
      });
      if (!membership) return res.status(403).json({ error: 'No perteneces a esta campaña' });
    }

    const characters = await prisma.character.findMany({
      where: { campaignId },
      include: characterInclude,
      orderBy: { createdAt: 'desc' },
    });

    // Un player solo ve sus propios personajes; el DM ve todos (con flag de edición)
    const visible = isOwner
      ? characters.map((c) => ({ ...serializeCharacter(c), canEdit: c.owner.allowDmEdit }))
      : characters.filter((c) => c.ownerId === req.userId).map(serializeCharacter);

    res.json({ characters: visible });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// GET /api/characters/:characterId — detalle (dueño o DM de la campaña)
// ────────────────────────────────────────────────
router.get('/:characterId', authenticate, requireCharacterAccess, async (req, res, next) => {
  try {
    const character = await prisma.character.findUnique({
      where: { id: req.character.id },
      include: characterInclude,
    });
    res.json({ character: serializeCharacter(character), canEdit: req.canEdit });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// PATCH /api/characters/:characterId — actualizar (dueño o DM con permiso)
// ────────────────────────────────────────────────
router.patch('/:characterId', authenticate, requireCharacterAccess, async (req, res, next) => {
  try {
    if (!req.canEdit) {
      return res.status(403).json({ error: 'El jugador no te ha dado permiso para editar este personaje' });
    }
    const b = req.body || {};
    const data = {};

    if (typeof b.name === 'string' && b.name.trim()) data.name = b.name.trim();
    if (typeof b.className === 'string' && b.className.trim()) data.className = b.className.trim();
    if (typeof b.race === 'string' && b.race.trim()) data.race = b.race.trim();
    if (typeof b.description === 'string') data.description = b.description.trim();
    if (typeof b.avatarUrl === 'string') data.avatarUrl = b.avatarUrl;
    if (Number.isInteger(b.level) && b.level >= 1 && b.level <= 20) data.level = b.level;
    if (typeof b.maxCapacity === 'number' && b.maxCapacity > 0) data.maxCapacity = b.maxCapacity;
    for (const f of STAT_FIELDS) {
      if (Number.isInteger(b[f]) && b[f] >= 1 && b[f] <= 30) data[f] = b[f];
    }
    // Cambiar campaña solo el dueño
    if (b.campaignId !== undefined && req.character.ownerId === req.userId) {
      if (b.campaignId === null) {
        data.campaignId = null;
      } else {
        const membership = await prisma.campaignMember.findUnique({
          where: { campaignId_userId: { campaignId: b.campaignId, userId: req.userId } },
        });
        if (!membership) return res.status(403).json({ error: 'No perteneces a esa campaña' });
        data.campaignId = b.campaignId;
      }
    }

    const character = await prisma.character.update({
      where: { id: req.character.id },
      data,
      include: characterInclude,
    });
    res.json({ character: serializeCharacter(character) });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// DELETE /api/characters/:characterId — eliminar (solo dueño)
// ────────────────────────────────────────────────
router.delete('/:characterId', authenticate, requireCharacterAccess, async (req, res, next) => {
  try {
    if (req.character.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Solo el dueño puede eliminar su personaje' });
    }
    await prisma.character.delete({ where: { id: req.character.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// POST /api/characters/:characterId/transfer — transferir objeto a otro personaje propio
// ────────────────────────────────────────────────
router.post('/:characterId/transfer', authenticate, requireCharacterAccess, async (req, res, next) => {
  try {
    const { itemLibraryId, quantity } = req.body || {};
    const { targetCharacterId } = req.body || {};
    const qty = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;

    if (!itemLibraryId) return res.status(400).json({ error: 'Falta el objeto a transferir' });

    const source = await prisma.characterItem.findUnique({
      where: { characterId_itemId: { characterId: req.character.id, itemId: itemLibraryId } },
      include: { item: true },
    });
    if (!source || source.quantity < qty) {
      return res.status(400).json({ error: 'No tienes suficientes unidades de ese objeto' });
    }

    const target = await prisma.character.findUnique({ where: { id: targetCharacterId } });
    if (!target) return res.status(404).json({ error: 'Personaje destino no encontrado' });
    if (target.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Solo puedes transferir entre tus propios personajes' });
    }

    await prisma.$transaction([
      prisma.characterItem.update({
        where: { id: source.id },
        data: { quantity: { decrement: qty }, equipped: source.quantity - qty <= 0 ? false : source.equipped },
      }),
      prisma.characterItem.upsert({
        where: { characterId_itemId: { characterId: target.id, itemId: itemLibraryId } },
        update: { quantity: { increment: qty } },
        create: { characterId: target.id, itemId: itemLibraryId, quantity: qty },
      }),
      prisma.inventoryLog.create({
        data: {
          characterId: target.id,
          userId: req.userId,
          action: 'TRANSFER_ITEM',
          detail: `Recibido ${qty}× ${source.item.name} de otro personaje`,
        },
      }),
    ]);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
