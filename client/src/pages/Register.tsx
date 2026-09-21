import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<'PLAYER' | 'DM'>('PLAYER');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setBusy(true);
    try {
      await register(username.trim(), email.trim(), password, role);
      toast('success', '¡Cuenta creada! Que empiece la aventura.');
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-2 text-6xl">🎲</div>
          <h1 className="font-display text-3xl font-bold text-gold-400">Únete a la aventura</h1>
        </div>

        <form onSubmit={handleSubmit} className="panel p-6">
          <h2 className="font-display text-xl font-bold">Crear cuenta</h2>

          {error && (
            <div className="mt-4 rounded-lg border border-blood-600/50 bg-blood-700/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <label className="label">Nombre de usuario</label>
              <input
                className="input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ArthasElQuebrantahuesos"
                minLength={3}
                required
              />
            </div>
            <div>
              <label className="label">Correo electrónico</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Contraseña</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="label">Confirmar</label>
                <input
                  className="input"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Rol en la mesa</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('PLAYER')}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    role === 'PLAYER'
                      ? 'border-gold-500 bg-gold-500/10 ring-1 ring-gold-500/40'
                      : 'border-ink-500 bg-ink-800 hover:border-ink-500/80'
                  }`}
                >
                  <div className="text-2xl">🧝</div>
                  <div className="mt-1 font-display font-bold">Jugador</div>
                  <div className="text-xs text-parchment/50">Creo personajes y llevo su inventario</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('DM')}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    role === 'DM'
                      ? 'border-gold-500 bg-gold-500/10 ring-1 ring-gold-500/40'
                      : 'border-ink-500 bg-ink-800 hover:border-ink-500/80'
                  }`}
                >
                  <div className="text-2xl">🐉</div>
                  <div className="mt-1 font-display font-bold">Dungeon Master</div>
                  <div className="text-xs text-parchment/50">Creo campañas y dirijo la partida</div>
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
            {busy ? 'Forjando cuenta…' : '⚒️ Crear cuenta'}
          </button>

          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="text-gold-400/80 hover:text-gold-300">
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
