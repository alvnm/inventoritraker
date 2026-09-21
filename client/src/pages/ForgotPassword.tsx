import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/endpoints';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const d = await authApi.forgotPassword({ email: email.trim() });
      setSent(true);
      if (d.resetUrl) setResetUrl(d.resetUrl);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-2 text-6xl">🗝️</div>
          <h1 className="font-display text-2xl font-bold text-gold-400">Recuperar contraseña</h1>
        </div>

        <div className="panel p-6">
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-parchment/80">
                Si el correo está registrado, se ha generado un enlace de recuperación válido durante 1 hora.
              </p>
              {resetUrl && (
                <div className="rounded-lg border border-gold-500/30 bg-gold-500/5 p-4 text-sm">
                  <p className="mb-2 font-semibold text-gold-300">Modo desarrollo — sin servidor de correo:</p>
                  <a href={resetUrl} className="break-all text-gold-400 underline">
                    Abrir enlace de recuperación
                  </a>
                </div>
              )}
              <Link to="/login" className="btn-secondary w-full">
                Volver al inicio de sesión
              </Link>
              <p className="text-xs text-parchment/40">
                En producción, conecta un servicio SMTP y envía el enlace por correo.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 rounded-lg border border-blood-600/50 bg-blood-700/20 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}
              <label className="label">Correo electrónico</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                required
              />
              <button type="submit" disabled={busy} className="btn-primary mt-4 w-full">
                {busy ? 'Enviando…' : 'Generar enlace'}
              </button>
              <div className="mt-4 text-center text-sm">
                <Link to="/login" className="text-gold-400/80 hover:text-gold-300">
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
