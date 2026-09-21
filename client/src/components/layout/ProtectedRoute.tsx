import { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function RequireAuth({ children }: { children?: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="font-display text-lg text-gold-400">Invocando tu sesión…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children ?? <Outlet />}</>;
}

export function RequireDM({ children }: { children?: ReactNode }) {
  const { isDM, loading } = useAuth();
  if (loading) return null;
  if (!isDM) {
    return (
      <div className="panel mx-auto max-w-md p-8 text-center">
        <div className="mb-3 text-4xl">🛡️</div>
        <h2 className="font-display text-xl font-bold text-gold-400">Zona exclusiva del DM</h2>
        <p className="mt-2 text-sm text-parchment/70">
          Esta sección solo está disponible para Dungeon Masters.
        </p>
      </div>
    );
  }
  return <>{children ?? <Outlet />}</>;
}
