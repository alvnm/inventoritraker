import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { itemsApi, charactersApi, inventoryApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import { Character } from '../types';
import { CATEGORY_LABELS, RARITY_LABELS } from '../lib/format';

export default function CreateItemPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'MISC',
    rarity: 'COMMON',
    weight: 1,
    value: 1,
    quantity: 1,
    imageUrl: '',
    notes: '',
    equippable: false,
  });
  const [characters, setCharacters] = useState<Character[]>([]);
  const [addToCharacter, setAddToCharacter] = useState('');
  const [equipNow, setEquipNow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    charactersApi
      .list()
      .then((d) => setCharacters(d.characters))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await itemsApi.create({
        name: form.name,
        description: form.description,
        category: form.category,
        rarity: form.rarity,
        weight: form.weight,
        value: form.value,
        equippable: form.equippable,
        imageUrl: form.imageUrl || undefined,
      });
      toast('success', `"${d.item.name}" creado y guardado en tu biblioteca personal`);

      if (addToCharacter) {
        await inventoryApi.add(addToCharacter, {
          itemId: d.item.id,
          quantity: form.quantity,
          notes: form.notes || undefined,
          equipped: equipNow && form.equippable,
        });
        toast('success', 'También se añadió al inventario seleccionado');
      }
      navigate('/app/library');
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gold-400">⚒️ Crear objeto</h1>
        <p className="text-sm text-parchment/50">
          Se guardará en tu biblioteca personal para reutilizarlo.{' '}
          <Link to="/app/library" className="text-gold-400 hover:underline">
            Ver biblioteca →
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="panel space-y-4 p-6">
        <div>
          <label className="label">Nombre</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Espada mata dragones"
            required
          />
        </div>

        <div>
          <label className="label">Descripción</label>
          <textarea
            className="input"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Una hoja legendaria forjada en las profundidades…"
          />
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
            <label className="label">Peso por unidad (lb)</label>
            <input className="input" type="number" min={0} step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Valor unitario (pc)</label>
            <input className="input" type="number" min={0} step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={form.equippable} onChange={(e) => setForm({ ...form, equippable: e.target.checked })} />
          ⚔️ Es equipable (armas, armaduras, anillos…)
        </label>

        <div>
          <label className="label">Imagen (URL opcional)</label>
          <input
            className="input"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://ejemplo.com/espada.png"
          />
        </div>

        {/* Añadir directamente a un inventario */}
        <div className="rounded-lg border border-gold-500/30 bg-gold-500/5 p-4">
          <div className="mb-3 text-sm font-semibold text-gold-300">➕ Agregar también a un inventario (opcional)</div>
          {characters.length > 0 ? (
            <div className="space-y-3">
              <div>
                <label className="label">Personaje</label>
                <select className="select" value={addToCharacter} onChange={(e) => setAddToCharacter(e.target.value)}>
                  <option value="">No agregar todavía</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.className} N{c.level})
                    </option>
                  ))}
                </select>
              </div>
              {addToCharacter && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Cantidad</label>
                    <input className="input" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                  </div>
                  {form.equippable && (
                    <label className="flex items-end gap-2 pb-2.5 text-sm">
                      <input type="checkbox" checked={equipNow} onChange={(e) => setEquipNow(e.target.checked)} />
                      Equipar de inmediato
                    </label>
                  )}
                </div>
              )}
              {addToCharacter && (
                <div>
                  <label className="label">Notas</label>
                  <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opcional…" />
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-parchment/50">Crea un personaje primero para agregar objetos a su mochila.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link to="/app/library" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Forjando…' : '⚒️ Crear objeto'}
          </button>
        </div>
      </form>
    </div>
  );
}
