import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/endpoints';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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
      await authApi.resetPassword({ token, password });
      alert('Contraseña actualizada. Inicia sesión con la nueva.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="panel max-w-md p-6 text-center">
          <div className="mb-3 text-4xl">🔒</div>
          <p className="text-sm text-parchment/80">Falta el token de recuperación en el enlace.</p>
          <Link to="/forgot-password" className="btn-primary mt-4">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-2 text-6xl">🔑</div>
          <h1 className="font-display text-2xl font-bold text-gold-400">Nueva contraseña</h1>
        </div>
        <form onSubmit={handleSubmit} className="panel p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-blood-600/50 bg-blood-700/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <label className="label">Nueva contraseña</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <label className="label mt-4">Confirmar contraseña</label>
          <input
            className="input"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
            {busy ? 'Guardando…' : 'Restablecer contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
