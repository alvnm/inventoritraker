import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { campaignsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CampaignSummary, CampaignMemberInfo } from '../types';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function CampaignDetailPage() {
  const { campaignId = '' } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [campaign, setCampaign] = useState<CampaignSummary | null>(null);
  const [members, setMembers] = useState<CampaignMemberInfo[]>([]);
  const [myRole, setMyRole] = useState('PLAYER');
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [toKick, setToKick] = useState<CampaignMemberInfo | null>(null);

  const load = () => {
    setLoading(true);
    campaignsApi
      .get(campaignId)
      .then((d) => {
        setCampaign(d.campaign);
        setMembers(d.members);
        setMyRole(d.myRole);
        setName(d.campaign.name);
        setDescription(d.campaign.description || '');
      })
      .catch((e) => toast('error', e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [campaignId]);

  if (loading) return <div className="panel p-8 text-center text-parchment/50">Abriendo la campaña…</div>;
  if (!campaign) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-parchment/60">Campaña no encontrada o sin acceso.</p>
        <Link to="/app/campaigns" className="btn-primary mt-4">Volver a campañas</Link>
      </div>
    );
  }

  const isOwner = campaign.ownerId === user?.id;

  const handleRegenerate = async () => {
    try {
      const d = await campaignsApi.regenerateCode(campaign.id);
      setCampaign({ ...campaign, inviteCode: d.inviteCode });
      toast('success', 'Nuevo código generado');
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const handleSaveInfo = async () => {
    try {
      const d = await campaignsApi.update(campaign.id, { name: name.trim(), description: description.trim() });
      setCampaign(d.campaign);
      setEditOpen(false);
      toast('success', 'Campaña actualizada');
      load();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const handleKick = async () => {
    if (!toKick) return;
    try {
      await campaignsApi.removeMember(campaign.id, toKick.userId);
      toast('success', `${toKick.username} fue expulsado de la mesa`);
      setToKick(null);
      load();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  return (
    <div>
      {/* Cabecera */}
      <div className="panel mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-gold-300">{campaign.name}</h1>
            {campaign.description && <p className="mt-1 text-sm text-parchment/60">{campaign.description}</p>}
            <div className="mt-2 flex gap-4 text-xs text-parchment/50">
              <span>👥 {campaign.playerCount} jugador(es)</span>
              <span>🧝 {campaign.characterCount} personaje(s)</span>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            {isOwner && (
              <>
                <button onClick={() => setEditOpen(true)} className="btn-secondary">✏️ Editar info</button>
                <button onClick={handleRegenerate} className="btn-ghost text-xs text-parchment/60">
                  🔄 Regenerar código
                </button>
              </>
            )}
            <div className="rounded-lg border border-gold-500/30 bg-gold-500/5 px-4 py-2 text-center">
              <div className="text-[10px] uppercase tracking-widest text-parchment/40">Código de invitación</div>
              <div className="font-mono text-xl font-bold tracking-[0.3em] text-gold-400">{campaign.inviteCode}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Jugadores */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">👥 Jugadores de la mesa</h2>
        <Link to="/app/players" className="btn-ghost text-xs text-gold-400">Vista completa de jugadores →</Link>
      </div>

      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.id} className="panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/15 font-display font-bold text-gold-300">
                  {m.username[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    {m.username}
                    {m.role === 'DM' && <span className="badge bg-purple-900/60 text-purple-200">DM</span>}
                    {m.userId === user?.id && <span className="badge bg-ink-700 text-parchment/50">tú</span>}
                  </div>
                  <div className="text-xs text-parchment/40">
                    {m.allowDmEdit ? '🔓 Permite edición del DM' : '🔒 Solo lectura para el DM'}
                  </div>
                </div>
              </div>
              {isOwner && m.role !== 'DM' && (
                <button onClick={() => setToKick(m)} className="btn-ghost px-3 py-1.5 text-xs text-blood-500 hover:text-blood-500">
                  Expulsar
                </button>
              )}
            </div>

            {/* Personajes del miembro */}
            <div className="mt-3 border-t border-ink-700 pt-3">
              {m.characters.length === 0 ? (
                <p className="text-xs text-parchment/40">Sin personajes todavía.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {m.characters.map((ch) => (
                    <Link
                      key={ch.id}
                      to={`/app/characters/${ch.id}`}
                      className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-xs transition-colors hover:border-gold-500/40"
                    >
                      <span className="font-semibold">{ch.name}</span>
                      <span className="ml-2 text-parchment/40">
                        {ch.className} N{ch.level} · 🎒 {ch.itemCount}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modales */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar campaña">
        <div className="space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setEditOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSaveInfo}>Guardar</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toKick}
        title="Expulsar jugador"
        message={`¿Seguro que quieres expulsar a ${toKick?.username} de la campaña? Podrá volver con el código si se le invita de nuevo.`}
        onConfirm={handleKick}
        onCancel={() => setToKick(null)}
      />
    </div>
  );
}
