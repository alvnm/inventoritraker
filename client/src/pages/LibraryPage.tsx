import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { itemsApi, charactersApi, inventoryApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import { Character, CharacterItem, Item } from '../types';
import { CATEGORY_ICONS, CATEGORY_LABELS, RARITY_COLORS, RARITY_LABELS, formatCopper } from '../lib/format';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function LibraryPage() {
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [rarity, setRarity] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);

  // Modal "agregar al inventario"
  const [adding, setAdding] = useState<Item | null>(null);
  const [addCharacter, setAddCharacter] = useState('');
  const [addQty, setAddQty] = useState(1);
  const [addNotes, setAddNotes] = useState('');
  const [addEquip, setAddEquip] = useState(false);

  const [toRemove, setToRemove] = useState<Item | null>(null);

  const load = () => {
    itemsApi
      .list({ search, category: category || undefined, rarity: rarity || undefined })
      .then((d) => setItems(d.items))
      .catch((e) => toast('error', e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search, category, rarity]);

  useEffect(() => {
    charactersApi
      .list()
      .then((d) => setCharacters(d.characters))
      .catch(() => {});
  }, []);

  // ── Agregar al inventario ───────────────────────────
  const handleAdd = async () => {
    if (!adding || !addCharacter) {
      toast('error', 'Selecciona un personaje');
      return;
    }
    try {
      await inventoryApi.add(addCharacter, { itemId: adding.id, quantity: addQty, notes: addNotes || undefined, equipped: addEquip });
      toast('success', `"${adding.name}" agregado al inventario`);
      setAdding(null);
      setAddQty(1);
      setAddNotes('');
      setAddEquip(false);
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const handleRemoveCustom = async () => {
    if (!toRemove) return;
    try {
      await itemsApi.remove(toRemove.id);
      toast('success', 'Objeto personalizado eliminado');
      setToRemove(null);
      load();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-400">📚 Biblioteca de objetos</h1>
          <p className="text-sm text-parchment/50">Catálogo compartido y tus objetos personalizados</p>
        </div>
        <Link to="/app/create-item" className="btn-primary">
          ⚒️ Crear objeto
        </Link>
      </div>

      {/* Filtros */}
      <div className="panel mb-4 grid gap-3 p-3 sm:grid-cols-[1fr_auto_auto]">
        <input className="input" placeholder="🔍 Buscar objetos…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select sm:w-52" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{CATEGORY_ICONS[k]} {v}</option>
          ))}
        </select>
        <select className="select sm:w-44" value={rarity} onChange={(e) => setRarity(e.target.value)}>
          <option value="">Toda rareza</option>
          {Object.entries(RARITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="panel p-8 text-center text-parchment/50">Consultando el grimorio…</div>
      ) : items.length === 0 ? (
        <div className="panel p-8 text-center text-parchment/50">Sin resultados para tu búsqueda.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <LibraryItemCard
              key={item.id}
              item={item}
              onAdd={(it) => {
                setAdding(it);
                setAddCharacter(characters[0]?.id || '');
              }}
              onEdit={() => setEditing(item)}
              onDelete={() => setToRemove(item)}
            />
          ))}
        </div>
      )}

      {/* ── Modal agregar al inventario ─────────────── */}
      <Modal open={!!adding} onClose={() => setAdding(null)} title={`Agregar: ${adding?.name ?? ''}`}>
        {characters.length === 0 ? (
          <div>
            <p className="text-sm text-parchment/60">Primero necesitas un personaje.</p>
            <Link to="/app/characters" className="btn-primary mt-4">Crear personaje</Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label">Personaje</label>
              <select className="select" value={addCharacter} onChange={(e) => setAddCharacter(e.target.value)}>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.className} N{c.level})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Cantidad</label>
              <input className="input" type="number" min={1} value={addQty} onChange={(e) => setAddQty(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Notas</label>
              <input className="input" value={addNotes} onChange={(e) => setAddNotes(e.target.value)} placeholder="Opcional…" />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={addEquip} disabled={!adding?.equippable} onChange={(e) => setAddEquip(e.target.checked)} />
              Equipar de inmediato
            </label>
            <button onClick={handleAdd} className="btn-primary w-full">+ Agregar al inventario</button>
          </div>
        )}
      </Modal>

      {/* ── Modal editar objeto propio ──────────────── */}
      {editing && (
        <EditItemLibraryModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={!!toRemove}
        title="Eliminar objeto personalizado"
        message={`¿Seguro que quieres eliminar "${toRemove?.name}" de tu biblioteca personal? Los inventarios que lo contienen dejarán de mostrar sus datos compartidos.`}
        onConfirm={handleRemoveCustom}
        onCancel={() => setToRemove(null)}
      />
    </div>
  );
}

// ── Tarjeta ──────────────────────────────────────────
function LibraryItemCard({
  item,
  onAdd,
  onEdit,
  onDelete,
}: {
  item: Item;
  onAdd: (item: Item) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isCustom = !item.isLibrary;
  return (
    <div className="panel flex flex-col p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink-700 text-xl">
          {item.imageUrl ? <img src={item.imageUrl} className="h-full w-full rounded-lg object-cover" alt={item.name} /> : CATEGORY_ICONS[item.category]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="font-semibold">{item.name}</h3>
            <span className={`badge ${RARITY_COLORS[item.rarity]}`}>{RARITY_LABELS[item.rarity]}</span>
          </div>
          <p className="mt-0.5 text-xs text-parchment/40">
            {CATEGORY_ICONS[item.category]} {CATEGORY_LABELS[item.category]} · {item.weight} lb · {formatCopper(item.value)}
          </p>
        </div>
      </div>
      {item.description && <p className="mt-2 line-clamp-2 text-xs text-parchment/50">{item.description}</p>}

      <div className="mt-auto flex gap-2 pt-3">
        <button onClick={() => onAdd(item)} className="btn-primary flex-1 px-3 py-1.5 text-xs">
          + Agregar al inventario
        </button>
        {isCustom && (
          <>
            <button onClick={onEdit} className="btn-ghost px-2 py-1.5 text-xs" title="Editar">✏️</button>
            <button onClick={onDelete} className="btn-ghost px-2 py-1.5 text-xs text-blood-500 hover:text-blood-500" title="Eliminar">🗑️</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Modal edición de objeto de biblioteca personal ───
function EditItemLibraryModal({
  item,
  onClose,
  onSaved,
}: {
  item: Item;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<{ name: string; description: string; category: string; rarity: string; weight: number; value: number; equippable: boolean; imageUrl: string }>({
    name: item.name,
    description: item.description || '',
    category: item.category,
    rarity: item.rarity,
    weight: item.weight,
    value: item.value,
    equippable: item.equippable,
    imageUrl: item.imageUrl || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await itemsApi.update(item.id, form);
      toast('success', 'Objeto actualizado');
      onSaved();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  return (
    <Modal open onClose={onClose} title="Editar objeto">
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="label">Nombre</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Categoría</label>
            <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Rareza</label>
            <select className="select" value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })}>
              {Object.entries(RARITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Peso (lb)</label>
            <input className="input" type="number" min={0} step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Valor (pc)</label>
            <input className="input" type="number" min={0} step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={form.equippable} onChange={(e) => setForm({ ...form, equippable: e.target.checked })} />
          Es equipable
        </label>
        <div>
          <label className="label">Imagen (URL)</label>
          <input className="input" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
