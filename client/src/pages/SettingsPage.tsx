import { FormEvent, useState } from 'react';
import { authApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const { user, refreshUser, isDM } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await authApi.updateMe({ username: username.trim(), avatarUrl: avatarUrl.trim() || undefined });
      await refreshUser();
      toast('success', 'Perfil actualizado');
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const handleToggleDmEdit = async (value: boolean) => {
    try {
      await authApi.updateMe({ allowDmEdit: value });
      await refreshUser();
      toast('success', value ? 'El DM ya puede editar tu inventario' : 'El DM ya no puede editar tu inventario');
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast('error', 'Las contraseñas no coinciden');
      return;
    }
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast('success', 'Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gold-400">Configuración</h1>
        <p className="text-sm text-parchment/50">Tu cuenta y preferencias</p>
      </div>

      {/* Perfil */}
      <form onSubmit={handleSaveProfile} className="panel mb-6 p-6">
        <h2 className="mb-4 font-display text-lg font-bold">👤 Perfil</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nombre de usuario</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} required />
          </div>
          <div>
            <label className="label">Correo (no editable)</label>
            <input className="input opacity-50" value={user?.email || ''} disabled />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Avatar (URL)</label>
            <input className="input" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <button type="submit" className="btn-primary mt-4">💾 Guardar perfil</button>
      </form>

      {/* Permisos DM */}
      {!isDM && (
        <div className="panel mb-6 p-6">
          <h2 className="mb-1 font-display text-lg font-bold">🤝 Permisos del DM</h2>
          <p className="mb-4 text-sm text-parchment/50">
            Si lo activas, el Dungeon Master de tus campañas podrá modificar tu inventario, monedas y equipamiento.
            Si lo desactivas, solo podrá verlo.
          </p>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-ink-600 bg-ink-800 p-4">
            <div>
              <div className="font-semibold">Permitir al DM editar mi inventario</div>
              <div className="text-xs text-parchment/40">
                Estado actual: {user?.allowDmEdit ? 'activado 🔓' : 'desactivado 🔒'}
              </div>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 accent-gold-500"
              checked={user?.allowDmEdit ?? false}
              onChange={(e) => handleToggleDmEdit(e.target.checked)}
            />
          </label>
        </div>
      )}

      {/* Contraseña */}
      <form onSubmit={handleChangePassword} className="panel p-6">
        <h2 className="mb-4 font-display text-lg font-bold">🔑 Cambiar contraseña</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Contraseña actual</label>
            <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nueva contraseña</label>
              <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
            </div>
            <div>
              <label className="label">Confirmar nueva</label>
              <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
            </div>
          </div>
        </div>
        <button type="submit" className="btn-primary mt-4">Actualizar contraseña</button>
      </form>
    </div>
  );
}
