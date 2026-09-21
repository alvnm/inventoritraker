import { api } from './client';
import type {
  Character,
  CharacterItem,
  Currency,
  InventoryLogEntry,
  Item,
  CampaignSummary,
  CampaignMemberInfo,
} from '../types';

// ── Auth ────────────────────────────────────────────
export const authApi = {
  register: (body: { username: string; email: string; password: string; role: string }) =>
    api('/auth/register', { method: 'POST', body, auth: false }),
  login: (body: { email: string; password: string }) =>
    api('/auth/login', { method: 'POST', body, auth: false }),
  logout: () => api('/auth/logout', { method: 'POST' }),
  me: () => api<{ user: import('../types').User }>('/auth/me'),
  updateMe: (body: Partial<{ username: string; allowDmEdit: boolean; avatarUrl: string }>) =>
    api<{ user: import('../types').User }>('/auth/me', { method: 'PATCH', body }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api('/auth/me/password', { method: 'PATCH', body }),
  forgotPassword: (body: { email: string }) =>
    api<{ resetUrl?: string }>('/auth/forgot-password', { method: 'POST', body, auth: false }),
  resetPassword: (body: { token: string; password: string }) =>
    api('/auth/reset-password', { method: 'POST', body, auth: false }),
};

// ── Campaigns ───────────────────────────────────────
export const campaignsApi = {
  list: () => api<{ campaigns: CampaignSummary[] }>('/campaigns'),
  get: (id: string) =>
    api<{ campaign: CampaignSummary; myRole: string; members: CampaignMemberInfo[] }>(`/campaigns/${id}`),
  create: (body: { name: string; description?: string }) =>
    api<{ campaign: CampaignSummary }>('/campaigns', { method: 'POST', body }),
  update: (id: string, body: { name?: string; description?: string }) =>
    api<{ campaign: CampaignSummary }>(`/campaigns/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api(`/campaigns/${id}`, { method: 'DELETE' }),
  join: (code: string) =>
    api<{ campaignName: string }>('/campaigns/join', { method: 'POST', body: { code } }),
  regenerateCode: (id: string) => api<{ inviteCode: string }>(`/campaigns/${id}/regenerate-code`, { method: 'POST' }),
  removeMember: (campaignId: string, userId: string) =>
    api(`/campaigns/${campaignId}/members/${userId}`, { method: 'DELETE' }),
  leave: (id: string) => api(`/campaigns/${id}/leave`, { method: 'POST' }),
};

// ── Characters ──────────────────────────────────────
export const charactersApi = {
  list: (campaignId?: string) =>
    api<{ characters: Character[] }>(`/characters${campaignId ? `?campaignId=${campaignId}` : ''}`),
  listCampaign: (campaignId: string) =>
    api<{ characters: Character[] }>(`/characters/campaign/${campaignId}`),
  get: (id: string) => api<{ character: Character; canEdit: boolean }>(`/characters/${id}`),
  create: (body: Record<string, unknown>) =>
    api<{ character: Character }>('/characters', { method: 'POST', body }),
  update: (id: string, body: Record<string, unknown>) =>
    api<{ character: Character }>(`/characters/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api(`/characters/${id}`, { method: 'DELETE' }),
  transfer: (characterId: string, body: { itemLibraryId: string; targetCharacterId: string; quantity?: number }) =>
    api(`/characters/${characterId}/transfer`, { method: 'POST', body }),
};

// ── Items ───────────────────────────────────────────
export const itemsApi = {
  list: (params?: { search?: string; category?: string; rarity?: string; onlyMine?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.category) qs.set('category', params.category);
    if (params?.rarity) qs.set('rarity', params.rarity);
    if (params?.onlyMine) qs.set('onlyMine', 'true');
    const query = qs.toString();
    return api<{ items: Item[] }>(`/items${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api<{ item: Item }>(`/items/${id}`),
  create: (body: Record<string, unknown>) => api<{ item: Item }>('/items', { method: 'POST', body }),
  update: (id: string, body: Record<string, unknown>) =>
    api<{ item: Item }>(`/items/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api(`/items/${id}`, { method: 'DELETE' }),
};

// ── Character items (inventario) ────────────────────
export const inventoryApi = {
  list: (characterId: string) =>
    api<{ items: CharacterItem[]; canEdit: boolean }>(`/character-items/${characterId}`),
  add: (characterId: string, body: { itemId: string; quantity?: number; notes?: string; equipped?: boolean }) =>
    api<{ characterItem: CharacterItem }>(`/character-items/${characterId}`, { method: 'POST', body }),
  update: (characterId: string, itemId: string, body: { quantity?: number; equipped?: boolean; notes?: string }) =>
    api<{ characterItem: CharacterItem }>(`/character-items/${characterId}/${itemId}`, { method: 'PATCH', body }),
  remove: (characterId: string, itemId: string) =>
    api(`/character-items/${characterId}/${itemId}`, { method: 'DELETE' }),
  grant: (characterId: string, body: { itemId: string; quantity?: number }) =>
    api(`/character-items/${characterId}/grant`, { method: 'POST', body }),
};

// ── Currency ────────────────────────────────────────
export const currencyApi = {
  get: (characterId: string) =>
    api<{ currency: Currency; totalCopper: number; canEdit: boolean }>(`/currency/${characterId}`),
  update: (characterId: string, body: Record<string, unknown>) =>
    api<{ currency: Currency }>(`/currency/${characterId}`, { method: 'PATCH', body }),
};

// ── Logs ────────────────────────────────────────────
export const logsApi = {
  list: (characterId: string) => api<{ logs: InventoryLogEntry[] }>(`/logs/${characterId}`),
};
