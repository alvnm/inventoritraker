export type Role = 'PLAYER' | 'DM';

export type ItemCategory =
  | 'WEAPONS'
  | 'ARMOR'
  | 'POTIONS'
  | 'MAGIC_ITEMS'
  | 'TOOLS'
  | 'FOOD'
  | 'MATERIALS'
  | 'MISC';

export type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'VERY_RARE' | 'LEGENDARY';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  allowDmEdit: boolean;
  avatarUrl?: string | null;
}

export interface CampaignSummary {
  id: string;
  name: string;
  description?: string | null;
  inviteCode: string;
  ownerId: string;
  playerCount: number;
  memberCount: number;
  characterCount: number;
  createdAt: string;
}

export interface CampaignMemberInfo {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: 'DM' | 'PLAYER';
  allowDmEdit: boolean;
  joinedAt: string;
  characters: { id: string; name: string; level: number; className: string; race: string; itemCount: number }[];
}

export interface Currency {
  id?: string;
  characterId?: string;
  platinum: number;
  gold: number;
  electrum: number;
  silver: number;
  copper: number;
}

export interface Item {
  id: string;
  name: string;
  description?: string | null;
  category: ItemCategory;
  weight: number;
  value: number;
  rarity: ItemRarity;
  imageUrl?: string | null;
  equippable: boolean;
  isLibrary: boolean;
  ownerId?: string | null;
}

export interface CharacterItem {
  id: string;
  characterId: string;
  itemId: string;
  quantity: number;
  equipped: boolean;
  notes?: string | null;
  item: Item;
}

export interface Character {
  id: string;
  ownerId: string;
  campaignId?: string | null;
  name: string;
  level: number;
  className: string;
  race: string;
  description?: string | null;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  maxCapacity: number;
  avatarUrl?: string | null;
  currentWeight: number;
  itemCount: number;
  itemQuantity: number;
  currency: Currency;
  totalCopper: number;
  canEdit?: boolean;
  owner?: { id: string; username: string; allowDmEdit: boolean };
  campaign?: { id: string; name: string } | null;
  items?: CharacterItem[];
}

export interface InventoryLogEntry {
  id: string;
  action: string;
  detail?: string | null;
  by: string;
  createdAt: string;
}
