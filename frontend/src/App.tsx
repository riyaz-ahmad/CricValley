import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { TournamentsPage } from './pages/TournamentsPage';
import { TournamentDetailPage } from './pages/TournamentDetailPage';
import { TeamsPage } from './pages/TeamsPage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { MatchesPage } from './pages/MatchesPage';
import { LiveMatchPage } from './pages/LiveMatchPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminScorerPage } from './pages/admin/AdminScorerPage';
import { AdminStreamerPage } from './pages/admin/AdminStreamerPage';
import { BroadcastOverlayPage } from './pages/BroadcastOverlayPage';
import { PublicTeamRegistrationPage } from './pages/PublicTeamRegistrationPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="py-20 text-center text-slate-400">Authenticating session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Special Fullscreen OBS Transparent Graphic Overlay Route */}
              <Route path="/overlay/:id" element={<BroadcastOverlayPage />} />

              {/* Standard App Pages */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
                    <Navbar />
                    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                      <Routes>
                        {/* Public Pages */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/tournaments" element={<TournamentsPage />} />
                        <Route path="/tournaments/:identifier" element={<TournamentDetailPage />} />
                        <Route path="/teams" element={<TeamsPage />} />
                        <Route path="/teams/:id" element={<TeamDetailPage />} />
                        <Route path="/matches" element={<MatchesPage />} />
                        <Route path="/matches/:id" element={<LiveMatchPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register-team" element={<PublicTeamRegistrationPage />} />
                        <Route path="/players" element={<Navigate to="/tournaments" replace />} />

                        {/* Protected Admin Routes */}
                        <Route
                          path="/admin/dashboard"
                          element={
                            <ProtectedRoute>
                              <AdminDashboardPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/scorer/:id"
                          element={
                            <ProtectedRoute>
                              <AdminScorerPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/streamer/:id"
                          element={
                            <ProtectedRoute>
                              <AdminStreamerPage />
                            </ProtectedRoute>
                          }
                        />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                }
              />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
