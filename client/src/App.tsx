import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import { RequireAuth, RequireDM } from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PlayerDashboard from './pages/PlayerDashboard';
import DMDashboard from './pages/DMDashboard';
import CharactersPage from './pages/CharactersPage';
import CharacterDetailPage from './pages/CharacterDetailPage';
import InventoriesPage from './pages/InventoriesPage';
import LibraryPage from './pages/LibraryPage';
import CreateItemPage from './pages/CreateItemPage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import PlayersPage from './pages/PlayersPage';
import SettingsPage from './pages/SettingsPage';

function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'DM' ? '/dm' : '/player'} replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<DashboardRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Alias de dashboards por rol */}
          <Route
            path="/player"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<PlayerDashboard />} />
          </Route>
          <Route
            path="/dm"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<DMDashboard />} />
          </Route>

          {/* App protegida */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<PlayerDashboard />} />
            <Route path="characters" element={<CharactersPage />} />
            <Route path="characters/:characterId" element={<CharacterDetailPage />} />
            <Route path="inventories" element={<InventoriesPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="create-item" element={<CreateItemPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="campaigns/:campaignId" element={<CampaignDetailPage />} />
            <Route
              path="players"
              element={
                <RequireDM>
                  <PlayersPage />
                </RequireDM>
              }
            />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}
