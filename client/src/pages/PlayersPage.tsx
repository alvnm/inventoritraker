import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { campaignsApi, charactersApi, itemsApi, inventoryApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CampaignSummary, CampaignMemberInfo, Character, Item } from '../types';
import Modal from '../components/ui/Modal';

export default function PlayersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [members, setMembers] = useState<CampaignMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Entregar objeto
  const [grantTo, setGrantTo] = useState<Character | null>(null);
  const [library, setLibrary] = useState<Item[]>([]);
  const [grantSearch, setGrantSearch] = useState('');
  const [grantItemId, setGrantItemId] = useState('');
  const [grantQty, setGrantQty] = useState(1);

  useEffect(() => {
    campaignsApi
      .list()
      .then((d) => {
        setCampaigns(d.campaigns);
        if (d.campaigns.length > 0) setSelectedCampaign(d.campaigns[0].id);
      })
      .catch((e) => toast('error', e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadMembers = () => {
    if (!selectedCampaign) return;
    campaignsApi
      .get(selectedCampaign)
      .then((d) => setMembers(d.members))
      .catch((e) => toast('error', e.message));
  };

  useEffect(loadMembers, [selectedCampaign]);

  const openGrant = async (char: Character) => {
    setGrantTo(char);
    setGrantItemId('');
    setGrantQty(1);
    try {
      const d = await itemsApi.list();
      setLibrary(d.items);
    } catch {
      // noop
    }
  };

  const handleGrant = async () => {
    if (!grantTo || !grantItemId) return;
    try {
      await inventoryApi.grant(grantTo.id, { itemId: grantItemId, quantity: grantQty });
      toast('success', `Objeto entregado a ${grantTo.name}`);
      setGrantTo(null);
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const filteredLibrary = library.filter((i) =>
    grantSearch ? i.name.toLowerCase().includes(grantSearch.toLowerCase()) : true
  );

  const playersOnly = members.filter((m) => m.role === 'PLAYER');

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-400">Jugadores</h1>
          <p className="text-sm text-parchment/50">Los aventureros de tus mesas y sus héroes</p>
        </div>
        {campaigns.length > 0 && (
          <select
            className="select w-60"
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.playerCount})
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="panel p-8 text-center text-parchment/50">Reunirando a la mesa…</div>
      ) : campaigns.length === 0 ? (
        <div className="panel p-8 text-center">
          <div className="mb-2 text-4xl">👥</div>
          <p className="text-parchment/60">Crea una campaña para reunir jugadores.</p>
          <Link to="/app/campaigns" className="btn-primary mt-4">Ir a campañas</Link>
        </div>
      ) : playersOnly.length === 0 ? (
        <div className="panel p-8 text-center">
          <div className="mb-2 text-4xl">🪑</div>
          <p className="text-parchment/60">Todavía no se ha unido ningún jugador. Comparte el código de invitación.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {playersOnly.map((m) => (
            <div key={m.id} className="panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-500/15 font-display text-lg font-bold text-gold-300">
                    {m.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold">{m.username}</div>
                    <div className="text-xs text-parchment/40">
                      {m.allowDmEdit ? '🔓 Permite que edites su inventario' : '🔒 Inventario en solo lectura'}
                    </div>
                  </div>
                </div>
                <span className="badge bg-ink-700 text-parchment/60">
                  {m.characters.length} personaje(s)
                </span>
              </div>

              {/* Personajes con acciones rápidas */}
              <div className="mt-4 grid gap-3 border-t border-ink-700 pt-4 sm:grid-cols-2">
                {m.characters.map((ch) => (
                  <div key={ch.id} className="rounded-lg border border-ink-600 bg-ink-800 p-3">
                    <div className="flex items-center justify-between">
                      <Link to={`/app/characters/${ch.id}`} className="font-semibold hover:text-gold-300">
                        {ch.name}
                      </Link>
                      <span className="text-xs text-parchment/40">
                        {ch.className} N{ch.level}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => openGrant({ ...ch, ownerId: m.userId } as Character)} className="btn-secondary px-3 py-1.5 text-xs">
                        🎁 Entregar objeto
                      </button>
                      <Link to={`/app/characters/${ch.id}`} className="btn-ghost px-3 py-1.5 text-xs">
                        Ver inventario
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal entregar objeto */}
      <Modal open={!!grantTo} onClose={() => setGrantTo(null)} title={`Entregar objeto a ${grantTo?.name ?? ''}`} wide>
        <div className="space-y-4">
          <input
            className="input"
            placeholder="🔍 Buscar objeto en la biblioteca…"
            value={grantSearch}
            onChange={(e) => setGrantSearch(e.target.value)}
          />
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {filteredLibrary.map((item) => (
              <button
                key={item.id}
                onClick={() => setGrantItemId(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  grantItemId === item.id ? 'border-gold-500 bg-gold-500/10' : 'border-ink-600 bg-ink-800 hover:border-ink-500'
                }`}
              >
                <span className="text-xl">{item.imageUrl ? <img src={item.imageUrl} className="h-6 w-6" alt="" /> : '🎁'}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-xs text-parchment/40">{item.weight} lb · rareza {item.rarity}</div>
                </div>
              </button>
            ))}
            {filteredLibrary.length === 0 && <p className="py-4 text-center text-sm text-parchment/40">Sin resultados.</p>}
          </div>
          <div>
            <label className="label">Cantidad</label>
            <input className="input" type="number" min={1} value={grantQty} onChange={(e) => setGrantQty(Number(e.target.value))} />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setGrantTo(null)}>Cancelar</button>
            <button className="btn-primary" onClick={handleGrant} disabled={!grantItemId}>
              🎁 Entregar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
