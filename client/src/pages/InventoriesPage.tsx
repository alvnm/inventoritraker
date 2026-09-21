import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { charactersApi, campaignsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Character } from '../types';
import WeightBar from '../components/character/WeightBar';
import { weightStatus, WEIGHT_STATUS_META } from '../lib/format';

export default function InventoriesPage() {
  const { isDM } = useAuth();
  const toast = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignId, setCampaignId] = useState('');
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    charactersApi
      .list(campaignId || undefined)
      .then((d) => setCharacters(d.characters))
      .catch((e) => toast('error', e.message))
      .finally(() => setLoading(false));
  }, [campaignId]);

  useEffect(() => {
    campaignsApi
      .list()
      .then((d) => setCampaigns(d.campaigns.map((c) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-400">Inventarios</h1>
          <p className="text-sm text-parchment/50">
            {isDM ? 'Mochilas de los personajes de tus campañas' : 'Las mochilas de tus personajes'}
          </p>
        </div>
        {campaigns.length > 0 && (
          <select className="select w-56" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            <option value="">Todas las campañas</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="panel p-8 text-center text-parchment/50">Pesando mochilas…</div>
      ) : characters.length === 0 ? (
        <div className="panel p-8 text-center">
          <div className="mb-2 text-4xl">🎒</div>
          <p className="text-parchment/60">No hay personajes con inventario todavía.</p>
          <Link to="/app/characters" className="btn-primary mt-4">
            Ir a personajes
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => {
            const status = weightStatus(c.currentWeight, c.maxCapacity);
            const meta = WEIGHT_STATUS_META[status];
            return (
              <Link key={c.id} to={`/app/characters/${c.id}`} className="panel p-5 transition-colors hover:border-gold-500/40">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">{c.name}</h3>
                  <span className={`badge ${status === 'ok' ? 'bg-emerald-900/50 text-emerald-300' : status === 'near' ? 'bg-amber-900/50 text-amber-300' : 'bg-blood-700/60 text-red-200'}`}>
                    {status === 'ok' ? '✓' : status === 'near' ? '≈' : '⚠'} {meta.label.split(' ')[0]}
                  </span>
                </div>
                <p className="text-xs text-parchment/50">
                  {c.className} · Nivel {c.level}
                  {c.owner && !isDM ? '' : c.owner ? ` · ${c.owner.username}` : ''}
                </p>
                <div className="mt-3">
                  <WeightBar current={c.currentWeight} max={c.maxCapacity} compact />
                </div>
                <div className="mt-2 text-xs text-parchment/40">🎒 {c.itemCount} objetos distintos</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
