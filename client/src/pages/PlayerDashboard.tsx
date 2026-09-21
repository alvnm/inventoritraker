import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { charactersApi, campaignsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Character, CampaignSummary } from '../types';
import { formatCopper } from '../lib/format';
import WeightBar from '../components/character/WeightBar';

export default function PlayerDashboard() {
  const { user, isDM } = useAuth();
  const toast = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([charactersApi.list(), campaignsApi.list()])
      .then(([chars, camps]) => {
        setCharacters(chars.characters);
        setCampaigns(camps.campaigns);
      })
      .catch((e) => toast('error', e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalWeight = characters.reduce((a, c) => a + c.currentWeight, 0);
  const totalItems = characters.reduce((a, c) => a + c.itemCount, 0);
  const totalCopper = characters.reduce((a, c) => a + c.totalCopper, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gold-400">
          ¡Saludos, {user?.username}!
        </h1>
        <p className="text-sm text-parchment/50">Tu tablero de aventura</p>
      </div>

      {/* Resumen */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wider text-parchment/40">Peso total</div>
          <div className="mt-1 font-display text-2xl font-bold">{totalWeight.toFixed(1)} lb</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wider text-parchment/40">Objetos</div>
          <div className="mt-1 font-display text-2xl font-bold">{totalItems}</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wider text-parchment/40">Fortuna total</div>
          <div className="mt-1 font-display text-2xl font-bold text-gold-400">{formatCopper(totalCopper)}</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wider text-parchment/40">Campañas</div>
          <div className="mt-1 font-display text-2xl font-bold">{campaigns.length}</div>
        </div>
      </div>

      {/* Campañas */}
      {campaigns.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-display text-lg font-bold">🗺️ Mis campañas</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <Link key={c.id} to={`/app/campaigns/${c.id}`} className="panel p-4 transition-colors hover:border-gold-500/40">
                <div className="font-display font-bold text-gold-300">{c.name}</div>
                <div className="mt-1 text-xs text-parchment/50">
                  {c.playerCount} jugador(es) · {c.characterCount} personaje(s)
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Personajes */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">🧝 Mis personajes</h2>
        <Link to="/app/characters" className="btn-primary text-xs">
          + Nuevo personaje
        </Link>
      </div>

      {loading ? (
        <div className="panel p-8 text-center text-parchment/50">Cargando tu grupo…</div>
      ) : characters.length === 0 ? (
        <div className="panel p-8 text-center">
          <div className="mb-2 text-4xl">🧝</div>
          <p className="text-parchment/60">Aún no tienes personajes.</p>
          <Link to="/app/characters" className="btn-primary mt-4">
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => (
            <div key={c.id} className="panel flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 font-display text-xl font-bold text-gold-300">
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={c.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    c.name[0]?.toUpperCase()
                  )}
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
              <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-600 pt-4 text-xs">
                <Link to={`/app/characters/${c.id}`} className="btn-secondary px-3 py-1.5">
                  Ver
                </Link>
                <Link to={`/app/characters/${c.id}#inventory`} className="btn-secondary px-3 py-1.5">
                  Inventario
                </Link>
                <Link to={`/app/characters/${c.id}#coins`} className="btn-secondary px-3 py-1.5">
                  Monedas
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      {isDM && <p className="mt-8 text-center text-xs text-parchment/30">Eres DM: revisa el panel de campañas.</p>}
    </div>
  );
}
