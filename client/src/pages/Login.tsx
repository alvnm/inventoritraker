import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      toast('success', '¡Bienvenido de nuevo, aventurero!');
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-2 text-6xl">🐉</div>
          <h1 className="font-display text-3xl font-bold text-gold-400">D&D Inventory Tracker</h1>
          <p className="mt-1 text-sm text-parchment/50">Gestiona el equipo de tu grupo como un verdadero aventurero</p>
        </div>

        <form onSubmit={handleSubmit} className="panel p-6">
          <h2 className="font-display text-xl font-bold">Iniciar sesión</h2>

          {error && (
            <div className="mt-4 rounded-lg border border-blood-600/50 bg-blood-700/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <label className="label" htmlFor="email">Correo o usuario</label>
              <input
                id="email"
                className="input"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
            {busy ? 'Entrando…' : '⚔️ Entrar'}
          </button>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-gold-400/80 hover:text-gold-300">
              ¿Olvidaste tu contraseña?
            </Link>
            <Link to="/register" className="text-gold-400/80 hover:text-gold-300">
              Crear cuenta
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
