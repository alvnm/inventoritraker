import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  charactersApi,
  inventoryApi,
  currencyApi,
  itemsApi,
  logsApi,
} from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Character, CharacterItem, Currency, InventoryLogEntry, Item } from '../types';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  COIN_LABELS,
  CP_VALUES,
  RARITY_COLORS,
  RARITY_LABELS,
  formatCopper,
  totalCopper,
} from '../lib/format';
import WeightBar from '../components/character/WeightBar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function CharacterDetailPage() {
  const { characterId = '' } = useParams();
  const toast = useToast();
  const { user } = useAuth();

  const [character, setCharacter] = useState<Character | null>(null);
  const [items, setItems] = useState<CharacterItem[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filtros de inventario
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Modales
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editing, setEditing] = useState<CharacterItem | null>(null);
  const [toRemove, setToRemove] = useState<CharacterItem | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [transferOpen, setTransferOpen] = useState<CharacterItem | null>(null);
  const [transferQty, setTransferQty] = useState(1);
  const [myCharacters, setMyCharacters] = useState<Character[]>([]);
  const [logs, setLogs] = useState<InventoryLogEntry[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      charactersApi.get(characterId),
      inventoryApi.list(characterId),
      logsApi.list(characterId),
    ])
      .then(([char, inv, logs]) => {
        setCharacter(char.character);
        setCanEdit(char.canEdit);
        setItems(inv.items);
        setLogs(logs.logs);
      })
      .catch((e) => toast('error', e.message))
      .finally(() => setLoading(false));
  }, [characterId]);

  useEffect(load, [load]);

  const isOwner = character?.ownerId === user?.id;

  // ── Inventario derivado ─────────────────────────────
  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (ci) =>
          ci.item.name.toLowerCase().includes(q) ||
          (ci.item.description || '').toLowerCase().includes(q)
      );
    }
    if (category) list = list.filter((ci) => ci.item.category === category);

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'weight':
          return b.item.weight * b.quantity - a.item.weight * a.quantity;
        case 'quantity':
          return b.quantity - a.quantity;
        case 'value':
          return b.item.value * b.quantity - a.item.value * a.quantity;
        default:
          return a.item.name.localeCompare(b.item.name);
      }
    });
    return sorted;
  }, [items, search, category, sortBy]);

  const equipped = filtered.filter((ci) => ci.equipped);
  const backpack = filtered.filter((ci) => !ci.equipped);
  const currentWeight = character?.currentWeight ?? 0;

  // ── Acciones de inventario ──────────────────────────
  const handleEquip = async (ci: CharacterItem) => {
    try {
      await inventoryApi.update(characterId, ci.itemId, { equipped: !ci.equipped });
      toast('success', ci.equipped ? 'Objeto guardado en la mochila' : 'Objeto equipado');
      load();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const handleRemove = async () => {
    if (!toRemove) return;
    try {
      await inventoryApi.remove(characterId, toRemove.itemId);
      toast('success', `"${toRemove.item.name}" eliminado del inventario`);
      setToRemove(null);
      load();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const handleTransfer = async () => {
    if (!transferOpen || !transferTarget) return;
    try {
      await charactersApi.transfer(characterId, {
        itemLibraryId: transferOpen.itemId,
        targetCharacterId: transferTarget,
        quantity: transferQty,
      });
      toast('success', 'Objeto transferido');
      setTransferOpen(null);
      setTransferTarget('');
      setTransferQty(1);
      load();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const openTransfer = async (ci: CharacterItem) => {
    setTransferOpen(ci);
    setTransferQty(1);
    try {
      const d = await charactersApi.list();
      setMyCharacters(d.characters.filter((c) => c.id !== characterId));
    } catch {
      // noop
    }
  };

  if (loading && !character) {
    return <div className="panel p-8 text-center text-parchment/50">Desplegando la ficha…</div>;
  }
  if (!character) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-parchment/60">Personaje no encontrado o sin acceso.</p>
        <Link to="/app/characters" className="btn-primary mt-4">Volver</Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── Cabecera ─────────────────────────────────── */}
      <div className="panel mb-6 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gold-500/15 font-display text-3xl font-bold text-gold-300">
            {character.avatarUrl ? (
              <img src={character.avatarUrl} alt={character.name} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              character.name[0]?.toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-gold-300">{character.name}</h1>
              <span className="badge bg-ink-700 text-parchment/70">Nivel {character.level}</span>
              {!isOwner && (
                <span className="badge bg-purple-900/50 text-purple-200">
                  de {character.owner?.username} {canEdit ? '· editable' : '· solo lectura'}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-parchment/60">
              {character.className} · {character.race}
              {character.campaign && <> · 🗺️ {character.campaign.name}</>}
            </p>
            {character.description && (
              <p className="mt-2 text-sm italic text-parchment/50">{character.description}</p>
            )}

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[
                ['FUE', character.strength],
                ['DES', character.dexterity],
                ['CON', character.constitution],
                ['INT', character.intelligence],
                ['SAB', character.wisdom],
                ['CAR', character.charisma],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-lg border border-ink-600 bg-ink-800 px-2 py-1.5 text-center">
                  <div className="text-[10px] font-bold tracking-wider text-parchment/40">{label}</div>
                  <div className="font-display text-lg font-bold">{value as number}</div>
                </div>
              ))}
            </div>
          </div>
          {canEdit && (
            <button onClick={() => setEditSheetOpen(true)} className="btn-secondary shrink-0">
              ✏️ Editar ficha
            </button>
          )}
        </div>

        <div className="mt-5 border-t border-ink-600 pt-4">
          <WeightBar current={currentWeight} max={character.maxCapacity} />
        </div>
      </div>

      {/* ── Inventario ───────────────────────────────── */}
      <div id="inventory" className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">🎒 Inventario ({items.length})</h2>
        {canEdit && (
          <button onClick={() => setAddItemOpen(true)} className="btn-primary">
            + Agregar objeto
          </button>
        )}
      </div>

      {/* Buscador y filtros */}
      <div className="panel mb-4 grid gap-3 p-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          className="input"
          placeholder="🔍 Buscar objetos…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select sm:w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {CATEGORY_ICONS[k]} {v}
            </option>
          ))}
        </select>
        <select className="select sm:w-44" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="name">Ordenar: Nombre</option>
          <option value="weight">Ordenar: Peso total</option>
          <option value="quantity">Ordenar: Cantidad</option>
          <option value="value">Ordenar: Valor</option>
        </select>
      </div>

      {items.length === 0 ? (
        <div className="panel p-8 text-center">
          <div className="mb-2 text-4xl">🕸️</div>
          <p className="text-parchment/60">La mochila está vacía.</p>
          {canEdit && (
            <button onClick={() => setAddItemOpen(true)} className="btn-primary mt-4">
              Agregar el primer objeto
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Equipado */}
          {equipped.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gold-400">
                ⚔️ Equipado ({equipped.length})
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {equipped.map((ci) => (
                  <ItemCard key={ci.id} ci={ci} canEdit={canEdit} onEquip={handleEquip} onEdit={setEditing} onRemove={setToRemove} onTransfer={openTransfer} />
                ))}
              </div>
            </section>
          )}

          {/* Mochila */}
          {backpack.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-parchment/50">
                🎒 Mochila ({backpack.length})
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {backpack.map((ci) => (
                  <ItemCard key={ci.id} ci={ci} canEdit={canEdit} onEquip={handleEquip} onEdit={setEditing} onRemove={setToRemove} onTransfer={openTransfer} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Monedas ──────────────────────────────────── */}
      <CoinsSection characterId={characterId} canEdit={canEdit} onChange={load} />

      {/* ── Historial ────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-bold">📜 Historial de cambios</h2>
        {logs.length === 0 ? (
          <div className="panel p-6 text-center text-sm text-parchment/40">Sin movimientos registrados todavía.</div>
        ) : (
          <div className="panel divide-y divide-ink-700">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <span className="text-parchment/80">{l.detail || l.action}</span>
                  <span className="ml-2 text-xs text-parchment/40">por {l.by}</span>
                </div>
                <span className="shrink-0 text-xs text-parchment/30">
                  {new Date(l.createdAt).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Modales ──────────────────────────────────── */}
      <AddItemModal open={addItemOpen} onClose={() => setAddItemOpen(false)} characterId={characterId} onAdded={load} />

      <EditItemModal
        item={editing}
        onClose={() => setEditing(null)}
        characterId={characterId}
        itemId={editing?.itemId || ''}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />

      <EditSheetModal
        open={editSheetOpen}
        onClose={() => setEditSheetOpen(false)}
        character={character}
        onSaved={() => {
          setEditSheetOpen(false);
          load();
        }}
      />

      <ConfirmDialog
        open={!!toRemove}
        title="Eliminar objeto"
        message={`¿Seguro que quieres eliminar "${toRemove?.item.name}" del inventario?`}
        onConfirm={handleRemove}
        onCancel={() => setToRemove(null)}
      />

      {/* Transferir */}
      <Modal open={!!transferOpen} onClose={() => setTransferOpen(null)} title={`Transferir ${transferOpen?.item.name ?? ''}`}>
        {myCharacters.length === 0 ? (
          <p className="text-sm text-parchment/60">No tienes otros personajes para recibir objetos.</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTransfer();
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">Personaje destino</label>
              <select className="select" value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)} required>
                <option value="">Selecciona…</option>
                {myCharacters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.className} N{c.level})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Cantidad (máx. {transferOpen?.quantity})</label>
              <input
                className="input"
                type="number"
                min={1}
                max={transferOpen?.quantity}
                value={transferQty}
                onChange={(e) => setTransferQty(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setTransferOpen(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary">Transferir</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

// ── Tarjeta de objeto ────────────────────────────────
function ItemCard({
  ci,
  canEdit,
  onEquip,
  onEdit,
  onRemove,
  onTransfer,
}: {
  ci: CharacterItem;
  canEdit: boolean;
  onEquip: (ci: CharacterItem) => void;
  onEdit: (ci: CharacterItem) => void;
  onRemove: (ci: CharacterItem) => void;
  onTransfer: (ci: CharacterItem) => void;
}) {
  const totalWeight = Math.round(ci.item.weight * ci.quantity * 100) / 100;
  return (
    <div className={`panel p-4 ${ci.equipped ? 'border-gold-500/40' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink-700 text-xl">
          {ci.item.imageUrl ? (
            <img src={ci.item.imageUrl} alt={ci.item.name} className="h-full w-full rounded-lg object-cover" />
          ) : (
            CATEGORY_ICONS[ci.item.category] || '📦'
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold">{ci.item.name}</h4>
            <span className={`badge ${RARITY_COLORS[ci.item.rarity]}`}>{RARITY_LABELS[ci.item.rarity]}</span>
          </div>
          <p className="mt-0.5 text-xs text-parchment/50">
            {CATEGORY_LABELS[ci.item.category]} · {ci.item.weight} lb c/u · total {totalWeight} lb · {formatCopper(ci.item.value * ci.quantity)}
          </p>
          {ci.item.description && <p className="mt-1 line-clamp-2 text-xs text-parchment/40">{ci.item.description}</p>}
          {ci.notes && <p className="mt-1 rounded bg-ink-800 px-2 py-1 text-xs italic text-gold-300/80">📝 {ci.notes}</p>}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-xl font-bold text-gold-300">×{ci.quantity}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-ink-600 pt-3">
        {ci.item.equippable && canEdit && (
          <button onClick={() => onEquip(ci)} className={`btn-ghost px-3 py-1.5 text-xs ${ci.equipped ? 'text-gold-400' : ''}`}>
            {ci.equipped ? '↩️ Desequipar' : '⚔️ Equipar'}
          </button>
        )}
        {canEdit && (
          <>
            <button onClick={() => onEdit(ci)} className="btn-ghost px-3 py-1.5 text-xs">✏️ Editar</button>
            <button onClick={() => onTransfer(ci)} className="btn-ghost px-3 py-1.5 text-xs">🔁 Transferir</button>
            <button onClick={() => onRemove(ci)} className="btn-ghost px-3 py-1.5 text-xs text-blood-500 hover:text-blood-500">
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Modal: agregar desde biblioteca ──────────────────
function AddItemModal({
  open,
  onClose,
  characterId,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  characterId: string;
  onAdded: () => void;
}) {
  const toast = useToast();
  const [libraryItems, setLibraryItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [equip, setEquip] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    itemsApi
      .list({ search, category: category || undefined })
      .then((d) => setLibraryItems(d.items))
      .catch(() => {});
  }, [open, search, category]);

  const handleAdd = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await inventoryApi.add(characterId, { itemId: selected.id, quantity, notes: notes || undefined, equipped: equip });
      toast('success', `"${selected.name}" agregado al inventario`);
      setSelected(null);
      setQuantity(1);
      setNotes('');
      setEquip(false);
      onAdded();
      onClose();
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar objeto" wide>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input className="input" placeholder="Buscar en la biblioteca…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select sm:w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{CATEGORY_ICONS[k]} {v}</option>
          ))}
        </select>
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {libraryItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelected(item)}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              selected?.id === item.id ? 'border-gold-500 bg-gold-500/10' : 'border-ink-600 bg-ink-800 hover:border-ink-500'
            }`}
          >
            <span className="text-xl">{CATEGORY_ICONS[item.category]}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{item.name}</div>
              <div className="text-xs text-parchment/40">
                {item.weight} lb · {formatCopper(item.value)} · {RARITY_LABELS[item.rarity]}
              </div>
            </div>
            {item.isLibrary ? <span className="badge bg-ink-700 text-[10px] text-parchment/50">biblioteca</span> : <span className="badge bg-gold-500/15 text-[10px] text-gold-300">propio</span>}
          </button>
        ))}
        {libraryItems.length === 0 && <p className="py-6 text-center text-sm text-parchment/40">Sin resultados.</p>}
      </div>

      {selected && (
        <div className="mt-4 space-y-3 rounded-lg border border-gold-500/30 bg-gold-500/5 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Cantidad</label>
              <input className="input" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 pb-2.5 text-sm">
                <input type="checkbox" checked={equip} onChange={(e) => setEquip(e.target.checked)} disabled={!selected.equippable} />
                Equipar de inmediato
              </label>
            </div>
          </div>
          <div>
            <label className="label">Notas</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional…" />
          </div>
          <button onClick={handleAdd} disabled={busy} className="btn-primary w-full">
            {busy ? 'Agregando…' : `+ Agregar al inventario`}
          </button>
        </div>
      )}
    </Modal>
  );
}

// ── Modal: editar instancia ──────────────────────────
function EditItemModal({
  item,
  onClose,
  characterId,
  itemId,
  onSaved,
}: {
  item: CharacterItem | null;
  onClose: () => void;
  characterId: string;
  itemId: string;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [equipped, setEquipped] = useState(false);

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      setNotes(item.notes || '');
      setEquipped(item.equipped);
    }
  }, [item]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await inventoryApi.update(characterId, itemId, { quantity, notes, equipped });
      toast('success', 'Cambios guardados');
      onSaved();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  return (
    <Modal open={!!item} onClose={onClose} title={`Editar: ${item?.item.name ?? ''}`}>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="label">Cantidad</label>
          <input className="input" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Notas</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas del objeto…" />
        </div>
        {item?.item.equippable && (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={equipped} onChange={(e) => setEquipped(e.target.checked)} />
            Equipado
          </label>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary">Guardar cambios</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal: editar ficha ──────────────────────────────
function EditSheetModal({
  open,
  onClose,
  character,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  character: Character;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({ ...character });

  useEffect(() => {
    setForm({ ...character });
  }, [character, open]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await charactersApi.update(character.id, {
        name: form.name,
        level: form.level,
        className: form.className,
        race: form.race,
        description: form.description,
        avatarUrl: form.avatarUrl || undefined,
        maxCapacity: form.maxCapacity,
        strength: form.strength,
        dexterity: form.dexterity,
        constitution: form.constitution,
        intelligence: form.intelligence,
        wisdom: form.wisdom,
        charisma: form.charisma,
      });
      toast('success', 'Ficha actualizada');
      onSaved();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const stat = (field: keyof Character, label: string) => (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        type="number"
        min={1}
        max={30}
        value={form[field] as number}
        onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })}
      />
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Editar ficha" wide>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Nivel</label>
            <input className="input" type="number" min={1} max={20} value={form.level} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Clase</label>
            <input className="input" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} />
          </div>
          <div>
            <label className="label">Raza</label>
            <input className="input" value={form.race} onChange={(e) => setForm({ ...form, race: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea className="input" rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stat('strength', 'Fuerza')}
          {stat('dexterity', 'Destreza')}
          {stat('constitution', 'Constitución')}
          {stat('intelligence', 'Inteligencia')}
          {stat('wisdom', 'Sabiduría')}
          {stat('charisma', 'Carisma')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Capacidad máxima (lb)</label>
            <input className="input" type="number" min={1} step="0.5" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Avatar (URL)</label>
            <input className="input" value={form.avatarUrl || ''} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://…" />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary">Guardar cambios</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Sección de monedas ───────────────────────────────
function CoinsSection({
  characterId,
  canEdit,
  onChange,
}: {
  characterId: string;
  canEdit: boolean;
  onChange: () => void;
}) {
  const toast = useToast();
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [edit, setEdit] = useState<Currency | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    currencyApi
      .get(characterId)
      .then((d) => {
        setCurrency(d.currency);
        setEdit(d.currency);
      })
      .catch(() => {});
  }, [characterId]);

  useEffect(load, [load]);

  const coinField = (field: keyof Currency) => {
    const meta = COIN_LABELS[field as string];
    if (!meta) return null;
    const value = (edit as any)?.[field] ?? 0;
    const setVal = (v: number) => setEdit({ ...edit!, [field]: Math.max(0, v) } as Currency);
    return (
      <div className="panel p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            {meta.icon} {meta.name} <span className="text-xs text-parchment/40">({meta.abbr})</span>
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {canEdit && (
            <button type="button" className="btn-secondary h-9 w-9 rounded-lg p-0 text-lg" onClick={() => setVal(value - 1)}>
              −
            </button>
          )}
          <input
            className="input text-center"
            type="number"
            min={0}
            value={value}
            disabled={!canEdit}
            onChange={(e) => setVal(Number(e.target.value))}
          />
          {canEdit && (
            <button type="button" className="btn-secondary h-9 w-9 rounded-lg p-0 text-lg" onClick={() => setVal(value + 1)}>
              +
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleSave = async () => {
    if (!edit) return;
    setBusy(true);
    try {
      await currencyApi.update(characterId, {
        platinum: edit.platinum,
        gold: edit.gold,
        electrum: edit.electrum,
        silver: edit.silver,
        copper: edit.copper,
      });
      toast('success', 'Monedas actualizadas');
      load();
      onChange();
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="coins" className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">💰 Monedas</h2>
        {currency && (
          <span className="badge bg-gold-500/15 text-gold-300">Total: {formatCopper(totalCopper(currency))}</span>
        )}
      </div>

      {currency && edit ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(['platinum', 'gold', 'electrum', 'silver', 'copper'] as (keyof Currency)[]).map((f) => coinField(f))}
          </div>
          {canEdit && (
            <button onClick={handleSave} disabled={busy} className="btn-primary mt-4">
              {busy ? 'Guardando…' : '💾 Guardar monedas'}
            </button>
          )}
          <p className="mt-2 text-xs text-parchment/40">
            Equivalencias: 1 PP = 10 PO · 1 PE = 5 PO · 1 PO = 10 PA · 1 PA = 10 PC
          </p>
        </>
      ) : (
        <div className="panel p-6 text-center text-sm text-parchment/40">Cargando bolsillos…</div>
      )}
    </section>
  );
}
