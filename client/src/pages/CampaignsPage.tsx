import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { campaignsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CampaignSummary } from '../types';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function CampaignsPage() {
  const { user, isDM, refreshUser } = useAuth();
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Crear
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Unirse
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState('');

  const [toDelete, setToDelete] = useState<CampaignSummary | null>(null);
  const [toLeave, setToLeave] = useState<CampaignSummary | null>(null);

  const load = () => {
    setLoading(true);
    campaignsApi
      .list()
      .then((d) => setCampaigns(d.campaigns))
      .catch((e) => toast('error', e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast('error', 'Ponle nombre a tu campaña');
      return;
    }
    try {
      const d = await campaignsApi.create({ name: name.trim(), description: description.trim() });
      toast('success', `¡La campaña "${d.campaign.name}" ha comenzado!`);
      setCreateOpen(false);
      setName('');
      setDescription('');
      load();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    try {
      const d = await campaignsApi.join(code.trim());
      toast('success', `¡Te has unido a "${d.campaignName}"!`);
      setJoinOpen(false);
      setCode('');
      load();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await campaignsApi.remove(toDelete.id);
      toast('success', 'Campaña disuelta');
      setToDelete(null);
      load();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const handleLeave = async () => {
    if (!toLeave) return;
    try {
      await campaignsApi.leave(toLeave.id);
      toast('success', 'Has salido de la campaña');
      setToLeave(null);
      load();
      refreshUser();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-400">
            {isDM ? 'Mis campañas' : 'Campañas'}
          </h1>
          <p className="text-sm text-parchment/50">
            {isDM ? 'Las mesas que diriges' : 'Las mesas a las que perteneces'}
          </p>
        </div>
        <div className="flex gap-2">
          {!isDM && (
            <button onClick={() => setJoinOpen(true)} className="btn-secondary">
              🎟️ Unirse con código
            </button>
          )}
          {isDM && (
            <button onClick={() => setCreateOpen(true)} className="btn-primary">
              + Nueva campaña
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="panel p-8 text-center text-parchment/50">Desplegando el mapa…</div>
      ) : campaigns.length === 0 ? (
        <div className="panel p-8 text-center">
          <div className="mb-2 text-4xl">🗺️</div>
          <p className="text-parchment/60">
            {isDM ? 'Aún no has creado campañas.' : 'Aún no perteneces a ninguna campaña.'}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {isDM ? (
              <button onClick={() => setCreateOpen(true)} className="btn-primary">Crear la primera</button>
            ) : (
              <button onClick={() => setJoinOpen(true)} className="btn-primary">Unirse con código</button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => {
            const isOwner = c.ownerId === user?.id;
            return (
              <div key={c.id} className="panel flex flex-col p-5">
                <Link to={`/app/campaigns/${c.id}`} className="flex-1">
                  <h3 className="font-display text-lg font-bold text-gold-300 hover:text-gold-200">{c.name}</h3>
                  {c.description && <p className="mt-1 line-clamp-2 text-sm text-parchment/50">{c.description}</p>}
                  <div className="mt-3 flex gap-4 text-xs text-parchment/60">
                    <span>👥 {c.playerCount}</span>
                    <span>🧝 {c.characterCount}</span>
                  </div>
                  {isOwner && (
                    <div className="mt-2 text-xs text-parchment/40">
                      Código: <span className="font-mono tracking-widest text-gold-400">{c.inviteCode}</span>
                    </div>
                  )}
                </Link>
                <div className="mt-4 flex gap-2 border-t border-ink-600 pt-3">
                  <Link to={`/app/campaigns/${c.id}`} className="btn-secondary flex-1 px-3 py-1.5 text-xs">
                    Entrar
                  </Link>
                  {!isOwner && (
                    <button onClick={() => setToLeave(c)} className="btn-ghost px-3 py-1.5 text-xs text-blood-500 hover:text-blood-500">
                      Salir
                    </button>
                  )}
                  {isOwner && (
                    <button onClick={() => setToDelete(c)} className="btn-ghost px-3 py-1.5 text-xs text-blood-500 hover:text-blood-500">
                      Disolver
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal crear */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva campaña">
        <div className="space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="La Sombra de Baldur's Gate" />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea
              className="input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Una campaña de intriga y dragones…"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setCreateOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleCreate}>Crear campaña</button>
          </div>
        </div>
      </Modal>

      {/* Modal unirse */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Unirse a una campaña">
        <div className="space-y-4">
          <div>
            <label className="label">Código de invitación</label>
            <input
              className="input font-mono text-lg tracking-[0.3em] uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCDEFGH"
              maxLength={8}
            />
          </div>
          <button onClick={handleJoin} className="btn-primary w-full">🎟️ Unirme</button>
          <p className="text-xs text-parchment/40">Pide el código a tu Dungeon Master.</p>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Disolver campaña"
        message={`¿Seguro que quieres disolver "${toDelete?.name}"? Se eliminarán sus membresías y las asociaciones de personajes. Esta acción no se puede deshacer.`}
        confirmLabel="Disolver"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={!!toLeave}
        title="Salir de la campaña"
        message={`¿Seguro que quieres salir de "${toLeave?.name}"? Tus personajes quedarán sin campaña asignada.`}
        confirmLabel="Salir"
        onConfirm={handleLeave}
        onCancel={() => setToLeave(null)}
      />
    </div>
  );
}
