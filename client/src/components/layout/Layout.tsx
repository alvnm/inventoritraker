import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const playerNav: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: '🏠' },
  { to: '/app/characters', label: 'Mis personajes', icon: '🧝' },
  { to: '/app/inventories', label: 'Inventarios', icon: '🎒' },
  { to: '/app/library', label: 'Biblioteca de objetos', icon: '📚' },
  { to: '/app/create-item', label: 'Crear objeto', icon: '⚒️' },
  { to: '/app/campaigns', label: 'Campañas', icon: '🗺️' },
  { to: '/app/settings', label: 'Configuración', icon: '⚙️' },
];

const dmNav: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: '🏠' },
  { to: '/app/campaigns', label: 'Mis campañas', icon: '🗺️' },
  { to: '/app/players', label: 'Jugadores', icon: '👥' },
  { to: '/app/characters', label: 'Personajes', icon: '🧝' },
  { to: '/app/inventories', label: 'Inventarios', icon: '🎒' },
  { to: '/app/library', label: 'Biblioteca de objetos', icon: '📚' },
  { to: '/app/create-item', label: 'Crear objeto', icon: '⚒️' },
  { to: '/app/settings', label: 'Configuración', icon: '⚙️' },
];

export default function Layout() {
  const { user, logout, isDM } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = isDM ? dmNav : playerNav;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-600 bg-ink-900 transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-ink-600 px-5 py-5">
          <span className="text-2xl">🐉</span>
          <div>
            <div className="font-display text-base font-bold leading-tight text-gold-400">D&D Tracker</div>
            <div className="text-[10px] uppercase tracking-widest text-parchment/40">Inventario de campaña</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30'
                    : 'text-parchment/70 hover:bg-ink-800 hover:text-parchment'
                }`
              }
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-600 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500/20 font-display text-sm font-bold text-gold-300">
              {user?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{user?.username}</div>
              <div className="text-xs text-parchment/50">{isDM ? 'Dungeon Master' : 'Jugador'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary w-full text-blood-500 hover:text-blood-500">
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink-600 bg-ink-900/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2 text-xl" aria-label="Abrir menú">
            ☰
          </button>
          <span className="font-display font-bold text-gold-400">D&D Tracker</span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
