import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Search, Sun, Moon, Shield, Calendar, LayoutDashboard, LogIn, LogOut, Menu, X, Home, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GlobalSearchModal } from './GlobalSearchModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo - CricValley */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Trophy className="w-6 h-6 text-slate-950 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-black text-2xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  CricValley
                </span>
                <span className="text-[9px] text-emerald-400 tracking-widest font-extrabold uppercase -mt-1">
                  Tournament Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
              <Link
                to="/tournaments"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive('/tournaments') ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 shadow-md shadow-emerald-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" /> Tournaments
              </Link>

              <Link
                to="/teams"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive('/teams') ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 shadow-md shadow-emerald-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> Teams
              </Link>

              <Link
                to="/matches"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive('/matches') ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 shadow-md shadow-emerald-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Matches & Scores
              </Link>

              <Link
                to="/register-team"
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  isActive('/register-team')
                    ? 'text-cyan-300 bg-cyan-950/80 border border-cyan-700 shadow-md'
                    : 'text-cyan-400 hover:text-cyan-200 bg-cyan-950/40 border border-cyan-800/50'
                }`}
              >
                📝 Register Team
              </Link>

              {user && (
                <Link
                  to="/admin/dashboard"
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 text-amber-400 bg-amber-950/60 border border-amber-800/60 hover:bg-amber-900/60`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Admin Hub
                </Link>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3"
                title="Search CricValley"
              >
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-slate-400">Search...</span>
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              </button>

              {user ? (
                <button
                  onClick={logout}
                  className="px-3.5 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" /> Admin Login
                </Link>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-5 space-y-2">
            <Link to="/tournaments" onClick={() => setIsMobileMenuOpen(false)} className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800">🏆 Tournaments</Link>
            <Link to="/teams" onClick={() => setIsMobileMenuOpen(false)} className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800">🛡️ Teams</Link>
            <Link to="/matches" onClick={() => setIsMobileMenuOpen(false)} className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800">📅 Matches & Scores</Link>
            <Link to="/register-team" onClick={() => setIsMobileMenuOpen(false)} className="block px-3.5 py-2.5 rounded-xl text-sm font-black text-cyan-300 bg-cyan-950/80 border border-cyan-800">📝 Register Team</Link>
            {user && (
              <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-amber-400 bg-amber-950/60 border border-amber-800">📊 Admin Hub</Link>
            )}
          </div>
        )}
      </nav>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Sticky Bottom Quick Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-2 flex items-center justify-around shadow-2xl">
        <Link
          to="/"
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            isActive('/') ? 'text-emerald-400 font-black scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Home</span>
        </Link>
        <Link
          to="/matches"
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            isActive('/matches') ? 'text-emerald-400 font-black scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Matches</span>
        </Link>
        <Link
          to="/tournaments"
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            isActive('/tournaments') ? 'text-emerald-400 font-black scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Points</span>
        </Link>
        <Link
          to="/teams"
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            isActive('/teams') ? 'text-emerald-400 font-black scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Teams</span>
        </Link>
        <Link
          to="/register-team"
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            isActive('/register-team') ? 'text-cyan-300 font-black scale-105' : 'text-cyan-400 hover:text-cyan-200'
          }`}
        >
          <UserPlus className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Register</span>
        </Link>
      </div>
    </>
  );
};
