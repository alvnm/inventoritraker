import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { charactersApi, campaignsApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import { Character, CampaignSummary } from '../types';
import { formatCopper } from '../lib/format';
import WeightBar from '../components/character/WeightBar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const CLASSES = ['Barbaro', 'Bardo', 'Brujo', 'Clérigo', 'Druida', 'Explorador', 'Guerrero', 'Hechicero', 'Mago', 'Monje', 'Paladín'];
const RACES = ['Humano', 'Elfo', 'Enano', 'Mediano', 'Dracónido', 'Gnomo', 'Semiespíritu', 'Medio-orco', 'Tiefling'];

const emptyForm = {
  name: '',
  level: 1,
  className: 'Guerrero',
  race: 'Humano',
  description: '',
  maxCapacity: 15,
  campaignId: '',
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

export default function CharactersPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toDelete, setToDelete] = useState<Character | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([charactersApi.list(), campaignsApi.list()])
      .then(([chars, camps]) => {
        setCharacters(chars.characters);
        setCampaigns(camps.campaigns);
      })
      .catch((e) => toast('error', e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const body: Record<string, unknown> = { ...form, campaignId: form.campaignId || undefined };
      const d = await charactersApi.create(body);
      toast('success', `¡${d.character.name} entra en escena!`);
      setModalOpen(false);
      setForm(emptyForm);
      navigate(`/app/characters/${d.character.id}`);
    } catch (err: any) {
      toast('error', err.message);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await charactersApi.remove(toDelete.id);
      toast('success', 'Personaje retirado de la historia');
      setToDelete(null);
      load();
    } catch (err: any) {
      toast('error', err.message);
    }
  };

  const statInput = (field: string, label: string) => (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        type="number"
        min={1}
        max={30}
        value={form[field as keyof typeof form] as number}
        onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })}
      />
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-400">Mis personajes</h1>
          <p className="text-sm text-parchment/50">Los héroes bajo tu control</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          + Nuevo personaje
        </button>
      </div>

      {loading ? (
        <div className="panel p-8 text-center text-parchment/50">Cargando…</div>
      ) : characters.length === 0 ? (
        <div className="panel p-8 text-center">
          <div className="mb-2 text-4xl">🧝</div>
          <p className="text-parchment/60">Aún no has creado personajes.</p>
          <button onClick={() => setModalOpen(true)} className="btn-primary mt-4">
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => (
            <div key={c.id} className="panel flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 font-display text-xl font-bold text-gold-300">
                  {c.avatarUrl ? <img src={c.avatarUrl} className="h-full w-full rounded-full object-cover" alt={c.name} /> : c.name[0]?.toUpperCase()}
                </div>
                <span className="badge bg-ink-700 text-parchment/70">Nivel {c.level}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold">{c.name}</h3>
              <p className="text-sm text-parchment/50">
                {c.className} · {c.race}
              </p>
              <div className="mt-4">
                <WeightBar current={c.currentWeight} max={c.maxCapacity} compact />
              </div>
              <div className="mt-2 text-xs text-parchment/50">
                🎒 {c.itemCount} objetos · 💰 {formatCopper(c.totalCopper)}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-600 pt-4">
                <Link to={`/app/characters/${c.id}`} className="btn-secondary flex-1 px-3 py-1.5 text-xs">
                  Ver ficha
                </Link>
                <button
                  onClick={() => setToDelete(c)}
                  className="btn-ghost px-3 py-1.5 text-xs text-blood-500 hover:text-blood-500"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Crear personaje" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Arthas"
                required
              />
            </div>
            <div>
              <label className="label">Nivel</label>
              <input
                className="input"
                type="number"
                min={1}
                max={20}
                value={form.level}
                onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Clase</label>
              <select
                className="select"
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
              >
                {CLASSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Raza / especie</label>
              <select className="select" value={form.race} onChange={(e) => setForm({ ...form, race: e.target.value })}>
                {RACES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea
              className="input"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Caballero caído en busca de redención…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {statInput('strength', 'Fuerza')}
            {statInput('dexterity', 'Destreza')}
            {statInput('constitution', 'Constitución')}
            {statInput('intelligence', 'Inteligencia')}
            {statInput('wisdom', 'Sabiduría')}
            {statInput('charisma', 'Carisma')}
          </div>

          <div>
            <label className="label">Capacidad máxima (lb)</label>
            <input
              className="input"
              type="number"
              min={1}
              step="0.5"
              value={form.maxCapacity}
              onChange={(e) => setForm({ ...form, maxCapacity: Number(e.target.value) })}
            />
            <p className="mt-1 text-xs text-parchment/40">Regla rápida: Fuerza × 15 lb</p>
          </div>

          {campaigns.length > 0 && (
            <div>
              <label className="label">Campaña</label>
              <select
                className="select"
                value={form.campaignId}
                onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
              >
                <option value="">Sin campaña</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">Crear personaje</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar personaje"
        message={`¿Seguro que quieres eliminar a ${toDelete?.name}? Se borrarán su inventario y monedas. Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
