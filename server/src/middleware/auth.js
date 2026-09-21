const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../prisma');

function getBearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Requerir sesión válida
function authenticate(req, res, next) {
  const token = getBearer(req);
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
}

// Requerir rol DM
function requireDM(req, res, next) {
  if (req.userRole !== 'DM') {
    return res.status(403).json({ error: 'Solo los Dungeon Masters pueden hacer esto' });
  }
  next();
}

/**
 * Verifica que el usuario sea miembro de la campaña y adjunta req.campaign / req.membership.
 * DM requiere ser el dueño.
 */
async function requireCampaignMember(req, res, next) {
  const campaignId = req.params.campaignId || req.body?.campaignId;
  if (!campaignId) return res.status(400).json({ error: 'Falta campaignId' });

  const membership = await prisma.campaignMember.findUnique({
    where: { campaignId_userId: { campaignId, userId: req.userId } },
    include: { campaign: true },
  });

  if (!membership) return res.status(403).json({ error: 'No perteneces a esta campaña' });
  if (membership.role === 'DM' && membership.campaign.ownerId !== req.userId) {
    return res.status(403).json({ error: 'No eres el dueño de esta campaña' });
  }

  req.campaign = membership.campaign;
  req.membership = membership;
  next();
}

/**
 * Verifica acceso a un personaje:
 *  - Dueño del personaje: siempre puede.
 *  - DM dueño de la campaña del personaje: puede ver; editar solo si allowDmEdit.
 * Adjunta req.character y req.canEdit.
 */
async function requireCharacterAccess(req, res, next) {
  const characterId = req.params.characterId || req.body?.characterId;
  if (!characterId) return res.status(400).json({ error: 'Falta characterId' });

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: { campaign: true, owner: true },
  });
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' });

  let canView = false;
  let canEdit = false;

  if (character.ownerId === req.userId) {
    canView = true;
    canEdit = true;
  } else if (
    character.campaignId &&
    character.campaign &&
    character.campaign.ownerId === req.userId
  ) {
    // DM de la campaña
    canView = true;
    canEdit = Boolean(character.owner.allowDmEdit);
  }

  if (!canView) return res.status(403).json({ error: 'No tienes acceso a este personaje' });

  req.character = character;
  req.canEdit = canEdit;
  next();
}

module.exports = {
  authenticate,
  requireDM,
  requireCampaignMember,
  requireCharacterAccess,
};
