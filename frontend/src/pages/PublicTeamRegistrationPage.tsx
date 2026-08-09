import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, Shield, Users, Plus, Trash2, CheckCircle2, UserCheck, Calendar, MapPin, DollarSign, ArrowLeft, Zap, Sparkles } from 'lucide-react';
import { Tournament, Team, Player } from '../types';
import { apiRequest } from '../services/api';
import { storage } from '../services/storage';

interface PlayerInput {
  name: string;
  role: 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKET_KEEPER';
  battingStyle: string;
  jerseyNumber: number;
}

export const PublicTeamRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Form State
  const [teamName, setTeamName] = useState('');
  const [shortName, setShortName] = useState('');
  const [city, setCity] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [captainEmail, setCaptainEmail] = useState('');

  // Roster of Players
  const [playersList, setPlayersList] = useState<PlayerInput[]>([
    { name: '', role: 'BATSMAN', battingStyle: 'Right-Handed', jerseyNumber: 7 },
    { name: '', role: 'BATSMAN', battingStyle: 'Right-Handed', jerseyNumber: 18 },
    { name: '', role: 'BATSMAN', battingStyle: 'Left-Handed', jerseyNumber: 45 },
    { name: '', role: 'WICKET_KEEPER', battingStyle: 'Right-Handed', jerseyNumber: 1 },
    { name: '', role: 'ALL_ROUNDER', battingStyle: 'Right-Handed', jerseyNumber: 33 },
    { name: '', role: 'ALL_ROUNDER', battingStyle: 'Left-Handed', jerseyNumber: 12 },
    { name: '', role: 'BOWLER', battingStyle: 'Right-Handed', jerseyNumber: 99 },
    { name: '', role: 'BOWLER', battingStyle: 'Right-Handed', jerseyNumber: 93 },
    { name: '', role: 'BOWLER', battingStyle: 'Left-Handed', jerseyNumber: 11 },
    { name: '', role: 'BOWLER', battingStyle: 'Right-Handed', jerseyNumber: 24 },
    { name: '', role: 'BOWLER', battingStyle: 'Right-Handed', jerseyNumber: 55 },
  ]);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const res = await apiRequest<Tournament[]>('/tournaments');
        setTournaments(res);
        if (res.length > 0) setSelectedTournamentId(res[0].id);
      } catch (err) {
        const localT = storage.getTournaments();
        setTournaments(localT);
        if (localT.length > 0) setSelectedTournamentId(localT[0].id);
      }
    };
    loadTournaments();
  }, []);

  const selectedTournament = tournaments.find((t) => t.id === selectedTournamentId);

  const addPlayerRow = () => {
    setPlayersList([
      ...playersList,
      { name: '', role: 'ALL_ROUNDER', battingStyle: 'Right-Handed', jerseyNumber: playersList.length + 1 },
    ]);
  };

  const removePlayerRow = (index: number) => {
    if (playersList.length <= 11) {
      alert('A minimum of 11 players is required for team registration.');
      return;
    }
    setPlayersList(playersList.filter((_, i) => i !== index));
  };

  const handlePlayerChange = (index: number, field: keyof PlayerInput, value: any) => {
    const updated = [...playersList];
    updated[index] = { ...updated[index], [field]: value };
    setPlayersList(updated);
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !shortName.trim() || !captainName.trim()) {
      alert('Please fill out Team Name, Short Name Tag, and Captain Name.');
      return;
    }

    const validPlayers = playersList.filter((p) => p.name.trim() !== '');
    if (validPlayers.length < 11) {
      alert('Please enter at least 11 player names for your squad roster.');
      return;
    }

    setSubmitting(true);
    const newTeamId = `team-${Date.now()}`;

    const newTeam: Team = {
      id: newTeamId,
      name: teamName.trim(),
      shortName: shortName.trim().toUpperCase(),
      city: city.trim() || 'Valley',
      captainName: captainName.trim(),
      foundedYear: new Date().getFullYear(),
    };

    const newPlayers: Player[] = validPlayers.map((p, idx) => ({
      id: `p-${newTeamId}-${idx + 1}`,
      name: p.name.trim(),
      teamId: newTeamId,
      role: p.role,
      battingStyle: p.battingStyle,
      bowlingStyle: 'Right-Arm Fast',
      jerseyNumber: p.jerseyNumber || idx + 1,
    }));

    try {
      // 1. Save to API backend if connected
      await apiRequest('/teams', {
        method: 'POST',
        body: JSON.stringify({
          tournamentId: selectedTournamentId,
          name: newTeam.name,
          shortName: newTeam.shortName,
          captainName: newTeam.captainName,
          city: newTeam.city,
          players: newPlayers,
        }),
      }).catch(() => {});

      // 2. Save locally for instant persistence
      const existingTeams = storage.getTeams();
      const existingPlayers = storage.getPlayers();
      const existingMatches = storage.getMatches();

      storage.saveTeams([...existingTeams, newTeam]);
      storage.savePlayers([...existingPlayers, ...newPlayers]);

      // Connect to tournament
      const allTournaments = storage.getTournaments();
      const updatedTournaments = allTournaments.map((t) => {
        if (t.id === selectedTournamentId) {
          const tTeams = t.teams || [];
          return {
            ...t,
            teams: [
              ...tTeams,
              {
                id: `tt-${t.id}-${newTeamId}`,
                tournamentId: t.id,
                teamId: newTeamId,
                team: newTeam,
                matchesPlayed: 0,
                wins: 0,
                losses: 0,
                ties: 0,
                noResults: 0,
                points: 0,
                netRunRate: 0.0,
                runsScored: 0,
                oversFaced: 0.0,
                runsConceded: 0,
                oversBowled: 0.0,
              },
            ],
          };
        }
        return t;
      });
      storage.saveTournaments(updatedTournaments);

      setSubmittedSuccess(true);
    } catch (err: any) {
      alert('Registration error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -z-0"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Public Team Registration
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-white">
              Register Your Cricket Team
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Submit your squad roster, captain details, and team tag to enter upcoming tournaments!
            </p>
          </div>

          <Link
            to="/tournaments"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 self-start md:self-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Tournaments List
          </Link>
        </div>
      </div>

      {submittedSuccess ? (
        <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-950 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-black text-white">Team Successfully Registered! 🎉</h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto">
              Your team <strong>{teamName} ({shortName.toUpperCase()})</strong> has been registered for{' '}
              <strong>{selectedTournament?.title || 'the tournament'}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSubmittedSuccess(false);
                setTeamName('');
                setShortName('');
                setCaptainName('');
              }}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs"
            >
              Register Another Team
            </button>
            <Link
              to="/tournaments"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
            >
              View Tournaments & Points Table →
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitRegistration} className="space-y-8">
          {/* Step 1: Tournament Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-heading font-extrabold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> 1. Select Tournament
            </h2>

            {tournaments.length === 0 ? (
              <div className="p-4 bg-amber-950/40 border border-amber-800/40 rounded-xl text-xs text-amber-300 font-bold">
                No active tournaments found. Please ask the tournament organizer to publish a tournament!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournaments.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTournamentId(t.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      selectedTournamentId === t.id
                        ? 'bg-slate-950 border-emerald-500 shadow-lg ring-1 ring-emerald-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-sm">{t.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {t.overs} Overs
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" /> {t.ground || 'Valley Ground'}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <DollarSign className="w-3.5 h-3.5" /> Fee: ₹{t.entryFee || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Team Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-heading font-extrabold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" /> 2. Team & Captain Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pinjoora Panthers"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Short Name / Tag (3 Chars) *</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="e.g. PIN"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white uppercase font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">City / Region</label>
                <input
                  type="text"
                  placeholder="e.g. Srinagar"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Captain Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Captain Full Name"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Captain Mobile No. *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={captainPhone}
                  onChange={(e) => setCaptainPhone(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Captain Email</label>
                <input
                  type="email"
                  placeholder="captain@cricket.com"
                  value={captainEmail}
                  onChange={(e) => setCaptainEmail(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Squad Roster (Minimum 11 Players) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-heading font-extrabold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" /> 3. Squad Roster ({playersList.length} Players)
              </h2>
              <button
                type="button"
                onClick={addPlayerRow}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Player
              </button>
            </div>

            <div className="space-y-2">
              {playersList.map((player, idx) => (
                <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                  <div className="sm:col-span-1 text-slate-400 font-mono font-bold text-center">
                    #{idx + 1}
                  </div>

                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder={`Player ${idx + 1} Name`}
                      value={player.name}
                      onChange={(e) => handlePlayerChange(idx, 'name', e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={player.role}
                      onChange={(e) => handlePlayerChange(idx, 'role', e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                    >
                      <option value="BATSMAN">BATSMAN</option>
                      <option value="BOWLER">BOWLER</option>
                      <option value="ALL_ROUNDER">ALL ROUNDER</option>
                      <option value="WICKET_KEEPER">WICKET KEEPER</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={player.battingStyle}
                      onChange={(e) => handlePlayerChange(idx, 'battingStyle', e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                    >
                      <option value="Right-Handed">Right-Handed</option>
                      <option value="Left-Handed">Left-Handed</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1 flex justify-center">
                    {playersList.length > 11 && (
                      <button
                        type="button"
                        onClick={() => removePlayerRow(idx)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-2xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <UserCheck className="w-5 h-5" />
              {submitting ? 'Submitting Registration...' : 'Submit Team Registration Now'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
