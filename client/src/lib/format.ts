export const CATEGORY_LABELS: Record<string, string> = {
  WEAPONS: 'Armas',
  ARMOR: 'Armaduras',
  POTIONS: 'Pociones',
  MAGIC_ITEMS: 'Objetos mágicos',
  TOOLS: 'Herramientas',
  FOOD: 'Comida',
  MATERIALS: 'Materiales',
  MISC: 'Misceláneos',
};

export const CATEGORY_ICONS: Record<string, string> = {
  WEAPONS: '⚔️',
  ARMOR: '🛡️',
  POTIONS: '🧪',
  MAGIC_ITEMS: '✨',
  TOOLS: '🔧',
  FOOD: '🍖',
  MATERIALS: '📦',
  MISC: '🎒',
};

export const RARITY_LABELS: Record<string, string> = {
  COMMON: 'Común',
  UNCOMMON: 'Poco común',
  RARE: 'Raro',
  VERY_RARE: 'Muy raro',
  LEGENDARY: 'Legendario',
};

export const RARITY_COLORS: Record<string, string> = {
  COMMON: 'bg-ink-600 text-parchment/80',
  UNCOMMON: 'bg-emerald-900/60 text-emerald-300',
  RARE: 'bg-sky-900/60 text-sky-300',
  VERY_RARE: 'bg-purple-900/60 text-purple-300',
  LEGENDARY: 'bg-blood-700/60 text-orange-300',
};

export const COIN_LABELS: Record<string, { name: string; abbr: string; icon: string }> = {
  platinum: { name: 'Platino', abbr: 'PP', icon: '🪙' },
  gold: { name: 'Oro', abbr: 'GP', icon: '🥇' },
  electrum: { name: 'Electrum', abbr: 'EP', icon: '🥈' },
  silver: { name: 'Plata', abbr: 'SP', icon: '🪙' },
  copper: { name: 'Cobre', abbr: 'CP', icon: '🟤' },
};

/** 1 PP = 10 GP = 2 EP = 50 SP = 500 CP */
export const CP_VALUES: Record<string, number> = {
  platinum: 500,
  gold: 100,
  electrum: 50,
  silver: 10,
  copper: 1,
};

export function totalCopper(c: { platinum: number; gold: number; electrum: number; silver: number; copper: number }): number {
  return (
    c.platinum * CP_VALUES.platinum +
    c.gold * CP_VALUES.gold +
    c.electrum * CP_VALUES.electrum +
    c.silver * CP_VALUES.silver +
    c.copper * CP_VALUES.copper
  );
}

export function formatCopper(cp: number): string {
  const gold = Math.floor(cp / CP_VALUES.gold);
  const remainder = cp % CP_VALUES.gold;
  if (gold > 0 && remainder === 0) return `${gold} po`;
  if (gold > 0) return `${gold} po ${remainder} pc`;
  return `${cp} pc`;
}

export type WeightStatus = 'ok' | 'near' | 'over';

export function weightStatus(current: number, max: number): WeightStatus {
  if (max <= 0) return 'ok';
  const ratio = current / max;
  if (ratio >= 1) return 'over';
  if (ratio >= 0.8) return 'near';
  return 'ok';
}

export const WEIGHT_STATUS_META: Record<WeightStatus, { label: string; color: string; bar: string }> = {
  ok: { label: 'Dentro de la capacidad', color: 'text-emerald-400', bar: 'bg-emerald-500' },
  near: { label: 'Cerca del límite', color: 'text-amber-400', bar: 'bg-amber-500' },
  over: { label: '¡Sobrepasando la capacidad!', color: 'text-blood-500', bar: 'bg-blood-500' },
};
