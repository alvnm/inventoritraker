const express = require('express');
const prisma = require('../prisma');
const { authenticate, requireDM, requireCampaignMember } = require('../middleware/auth');
const { generateInviteCode } = require('../lib/tokens');

const router = express.Router();

/** Serializa una campaña con contadores */
function withCounts(campaign) {
  const players = campaign.members.filter((m) => m.role === 'PLAYER');
  return {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    inviteCode: campaign.inviteCode,
    ownerId: campaign.ownerId,
    createdAt: campaign.createdAt,
    playerCount: players.length,
    memberCount: campaign.members.length,
    characterCount: (campaign.characters || []).length,
  };
}

const includeForCampaign = {
  members: {
    include: {
      user: { select: { id: true, username: true, email: true, role: true, allowDmEdit: true } },
    },
  },
  characters: { include: { owner: { select: { username: true } }, _count: { select: { items: true } } } },
};

// ────────────────────────────────────────────────
// GET /api/campaigns — campañas relevantes para el usuario
//  - DM: campañas que posee
//  - Player: campañas a las que pertenece
// ────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    let campaigns;
    if (req.userRole === 'DM') {
      campaigns = await prisma.campaign.findMany({
        where: { ownerId: req.userId },
        include: includeForCampaign,
        orderBy: { createdAt: 'desc' },
      });
    } else {
      campaigns = await prisma.campaign.findMany({
        where: { members: { some: { userId: req.userId } } },
        include: includeForCampaign,
        orderBy: { createdAt: 'desc' },
      });
    }
    res.json({ campaigns: campaigns.map(withCounts) });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// POST /api/campaigns — crear campaña (solo DM)
// ────────────────────────────────────────────────
router.post('/', authenticate, requireDM, async (req, res, next) => {
  try {
    const { name, description } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'El nombre de la campaña es obligatorio' });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        description: typeof description === 'string' ? description.trim() : null,
        ownerId: req.userId,
        members: { create: { userId: req.userId, role: 'DM' } },
      },
      include: includeForCampaign,
    });
    res.status(201).json({ campaign: withCounts(campaign) });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// GET /api/campaigns/:campaignId — detalle con jugadores y personajes
// ────────────────────────────────────────────────
router.get('/:campaignId', authenticate, requireCampaignMember, async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.campaign.id },
      include: includeForCampaign,
    });
    res.json({
      campaign: withCounts(campaign),
      myRole: req.membership.role,
      members: campaign.members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        username: m.user.username,
        email: m.user.email,
        role: m.role,
        allowDmEdit: m.user.allowDmEdit,
        joinedAt: m.joinedAt,
        characters: (campaign.characters || [])
          .filter((c) => c.ownerId === m.user.id)
          .map((c) => ({
            id: c.id,
            name: c.name,
            level: c.level,
            className: c.className,
            race: c.race,
            itemCount: c._count.items,
          })),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// PATCH /api/campaigns/:campaignId — actualizar nombre/descripción (dueño)
// ────────────────────────────────────────────────
router.patch('/:campaignId', authenticate, requireCampaignMember, async (req, res, next) => {
  try {
    if (req.campaign.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Solo el dueño puede editar la campaña' });
    }
    const { name, description } = req.body || {};
    const data = {};
    if (typeof name === 'string' && name.trim()) data.name = name.trim();
    if (typeof description === 'string') data.description = description.trim();

    const campaign = await prisma.campaign.update({
      where: { id: req.campaign.id },
      data,
      include: includeForCampaign,
    });
    res.json({ campaign: withCounts(campaign) });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// DELETE /api/campaigns/:campaignId — eliminar campaña (dueño)
// ────────────────────────────────────────────────
router.delete('/:campaignId', authenticate, requireCampaignMember, async (req, res, next) => {
  try {
    if (req.campaign.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Solo el dueño puede eliminar la campaña' });
    }
    await prisma.campaign.delete({ where: { id: req.campaign.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// POST /api/campaigns/join — unirse con código (cualquier usuario autenticado)
// ────────────────────────────────────────────────
router.post('/join', authenticate, async (req, res, next) => {
  try {
    const { code } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Falta el código de invitación' });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { inviteCode: code.trim().toUpperCase() },
    });
    if (!campaign) return res.status(404).json({ error: 'Código de invitación inválido' });

    const existing = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId: campaign.id, userId: req.userId } },
    });
    if (existing) {
      return res.status(409).json({ error: 'Ya perteneces a esta campaña', campaignId: campaign.id });
    }

    await prisma.campaignMember.create({
      data: { campaignId: campaign.id, userId: req.userId, role: 'PLAYER' },
    });
    res.status(201).json({ ok: true, campaignId: campaign.id, campaignName: campaign.name });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// POST /api/campaigns/:campaignId/regenerate-code — nuevo código (dueño)
// ────────────────────────────────────────────────
router.post('/:campaignId/regenerate-code', authenticate, requireCampaignMember, async (req, res, next) => {
  try {
    if (req.campaign.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Solo el dueño puede regenerar el código' });
    }
    const campaign = await prisma.campaign.update({
      where: { id: req.campaign.id },
      data: { inviteCode: generateInviteCode() },
    });
    res.json({ inviteCode: campaign.inviteCode });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// DELETE /api/campaigns/:campaignId/members/:userId — expulsar jugador (dueño)
// ────────────────────────────────────────────────
router.delete('/:campaignId/members/:userId', authenticate, requireCampaignMember, async (req, res, next) => {
  try {
    if (req.campaign.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Solo el dueño puede eliminar jugadores' });
    }
    const { userId } = req.params;
    if (userId === req.userId) {
      return res.status(400).json({ error: 'No puedes expulsarte a ti mismo (elimina la campaña)' });
    }
    await prisma.campaignMember.delete({
      where: { campaignId_userId: { campaignId: req.campaign.id, userId } },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────
// POST /api/campaigns/:campaignId/leave — salir de la campaña (player)
// ────────────────────────────────────────────────
router.post('/:campaignId/leave', authenticate, requireCampaignMember, async (req, res, next) => {
  try {
    if (req.campaign.ownerId === req.userId) {
      return res.status(400).json({ error: 'El dueño no puede salir; elimina la campaña' });
    }
    await prisma.campaignMember.delete({
      where: { campaignId_userId: { campaignId: req.campaign.id, userId: req.userId } },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
