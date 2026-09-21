import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { campaignsApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import { CampaignSummary } from '../types';

export default function DMDashboard() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    campaignsApi
      .list()
      .then((d) => setCampaigns(d.campaigns))
      .catch((e) => toast('error', e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalPlayers = campaigns.reduce((a, c) => a + c.playerCount, 0);
  const totalCharacters = campaigns.reduce((a, c) => a + c.characterCount, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gold-400">Panel del Dungeon Master</h1>
        <p className="text-sm text-parchment/50">Tus mesas y sus héroes</p>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wider text-parchment/40">Campañas</div>
          <div className="mt-1 font-display text-2xl font-bold">{campaigns.length}</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wider text-parchment/40">Jugadores</div>
          <div className="mt-1 font-display text-2xl font-bold">{totalPlayers}</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wider text-parchment/40">Personajes</div>
          <div className="mt-1 font-display text-2xl font-bold">{totalCharacters}</div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">🗺️ Mis campañas</h2>
        <Link to="/app/campaigns" className="btn-primary text-xs">
          + Nueva campaña
        </Link>
      </div>

      {loading ? (
        <div className="panel p-8 text-center text-parchment/50">Consultando los pergaminos…</div>
      ) : campaigns.length === 0 ? (
        <div className="panel p-8 text-center">
          <div className="mb-2 text-4xl">🗺️</div>
          <p className="text-parchment/60">Aún no has creado campañas.</p>
          <Link to="/app/campaigns" className="btn-primary mt-4">
            Crear la primera
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              to={`/app/campaigns/${c.id}`}
              className="panel group p-5 transition-colors hover:border-gold-500/40"
            >
              <div className="font-display text-lg font-bold text-gold-300 group-hover:text-gold-200">{c.name}</div>
              {c.description && <p className="mt-1 line-clamp-2 text-sm text-parchment/50">{c.description}</p>}
              <div className="mt-4 flex gap-4 border-t border-ink-600 pt-3 text-xs text-parchment/60">
                <span>👥 {c.playerCount} jugador(es)</span>
                <span>🧝 {c.characterCount} personaje(s)</span>
              </div>
              <div className="mt-3 text-xs text-parchment/40">
                Código: <span className="font-mono text-gold-400">{c.inviteCode}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
