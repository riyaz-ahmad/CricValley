import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Plus, Shield, Users, Calendar, Edit3, Trash2, CheckCircle2, Table, Zap, X, PlusCircle, Award, Activity, Circle, Video } from 'lucide-react';
import { Tournament, Team, Player, Match } from '../../types';
import { apiRequest } from '../../services/api';
import { storage } from '../../services/storage';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tournaments' | 'teams' | 'players' | 'matches'>('tournaments');

  // Data states initialized from storage
  const [tournaments, setTournaments] = useState<Tournament[]>(() => storage.getTournaments());
  const [teams, setTeams] = useState<Team[]>(() => storage.getTeams());
  const [players, setPlayers] = useState<Player[]>(() => storage.getPlayers());
  const [matches, setMatches] = useState<Match[]>(() => storage.getMatches());
  const [loading, setLoading] = useState(false);

  // Auto-sync state changes to persistent LocalStorage
  useEffect(() => {
    storage.saveTournaments(tournaments);
  }, [tournaments]);

  useEffect(() => {
    storage.saveTeams(teams);
  }, [teams]);

  useEffect(() => {
    storage.savePlayers(players);
  }, [players]);

  useEffect(() => {
    storage.saveMatches(matches);
  }, [matches]);

  // Modals state
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showBulkTeamGridModal, setShowBulkTeamGridModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showBulkPlayerGridModal, setShowBulkPlayerGridModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showBulkMatchGridModal, setShowBulkMatchGridModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMatch, setResultMatch] = useState<Match | null>(null);

  // Form states
  const [tForm, setTForm] = useState({
    title: '',
    description: '',
    format: 'LEAGUE_KNOCKOUT',
    overs: 20,
    ballType: 'Leather',
    entryFee: 5000,
    prizePool: '₹1,50,000 + Trophy & Medals',
    city: 'Srinagar',
    ground: 'Valley Sports Complex',
    startDate: '2026-09-01',
    endDate: '2026-09-25',
    contactEmail: 'support@cricvalley.com',
    contactPhone: '7780807508',
    rules: 'Standard T20 Playing Conditions. 6 Overs Powerplay.',
  });
  const [tmForm, setTmForm] = useState({ name: '', shortName: '', city: '', captainName: '', coachName: '' });

  // Grid Bulk Data States
  const [teamGridRows, setTeamGridRows] = useState([
    { name: 'Kolkata Knights', shortName: 'KKR', city: 'Kolkata', captainName: 'Shreyas Iyer' },
    { name: 'Rajasthan Royals', shortName: 'RR', city: 'Jaipur', captainName: 'Sanju Samson' },
    { name: 'Gujarat Titans', shortName: 'GT', city: 'Ahmedabad', captainName: 'Shubman Gill' },
  ]);

  const [pForm, setPForm] = useState({ name: '', jerseyNumber: 18, role: 'ALL_ROUNDER', battingStyle: 'Right-Handed', bowlingStyle: 'Right-Arm Fast', teamId: '' });
  const [bulkPlayerTeamId, setBulkPlayerTeamId] = useState('');
  const [playerGridRows, setPlayerGridRows] = useState([
    { name: 'Shubman Gill', jerseyNumber: 77, role: 'BATSMAN', battingStyle: 'Right-Handed' },
    { name: 'Rashid Khan', jerseyNumber: 19, role: 'BOWLER', battingStyle: 'Right-Handed' },
    { name: 'Rahul Tewatia', jerseyNumber: 9, role: 'ALL_ROUNDER', battingStyle: 'Left-Handed' },
  ]);

  const [mForm, setMForm] = useState({ tournamentId: '', homeTeamId: '', awayTeamId: '', stage: 'LEAGUE', scheduledAt: '2026-08-15T18:00', venue: '' });
  const [bulkMatchTournamentId, setBulkMatchTournamentId] = useState('');
  const [matchGridRows, setMatchGridRows] = useState<any[]>([]);

  const [resForm, setResForm] = useState({
    status: 'COMPLETED',
    stage: 'LEAGUE',
    tossWinnerId: '',
    tossDecision: 'BAT',
    winnerTeamId: '',
    playerOfTheMatchId: '',
    resultSummary: '',
    homeScoreRuns: 180,
    homeWickets: 4,
    homeOvers: 20,
    awayScoreRuns: 165,
    awayWickets: 8,
    awayOvers: 20,
  });

  const fetchAll = async () => {
    try {
      const [tData, tmData, pData, mData] = await Promise.all([
        apiRequest<Tournament[]>('/tournaments'),
        apiRequest<Team[]>('/teams'),
        apiRequest<Player[]>('/players'),
        apiRequest<Match[]>('/matches'),
      ]);
      setTournaments(tData);
      setTeams(tmData);
      setPlayers(pData);
      setMatches(mData);
    } catch (err) {
      // Clean fallback from persistent storage
      const tData = storage.getTournaments();
      const tmData = storage.getTeams();
      const pData = storage.getPlayers();
      const mData = storage.getMatches();
      setTournaments(tData);
      setTeams(tmData);
      setPlayers(pData);
      setMatches(mData);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // --- GRID BULK ADD HANDLERS ---
  const handleSaveTeamGrid = async (e: React.FormEvent) => {
    e.preventDefault();
    const validTeams = teamGridRows.filter((r) => r.name.trim() !== '' && r.shortName.trim() !== '');
    if (validTeams.length === 0) return alert('Please enter at least one valid team name!');

    try {
      const res = await apiRequest<{ message: string }>('/teams/bulk', {
        method: 'POST',
        body: JSON.stringify({ teams: validTeams }),
      });
      alert(res.message);
      setShowBulkTeamGridModal(false);
      fetchAll();
    } catch (err: any) {
      const newTeams: Team[] = validTeams.map((vt, i) => ({
        id: `team-bulk-${Date.now()}-${i}`,
        name: vt.name,
        shortName: vt.shortName.toUpperCase(),
        city: vt.city,
        captainName: vt.captainName,
      }));
      setTeams((prev) => [...prev, ...newTeams]);
      setShowBulkTeamGridModal(false);
      alert(`Successfully added ${newTeams.length} teams!`);
    }
  };

  const handleSavePlayerGrid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkPlayerTeamId) return alert('Please select a target team!');
    const validPlayers = playerGridRows.filter((r) => r.name.trim() !== '');
    if (validPlayers.length === 0) return alert('Please enter at least one valid player name!');

    try {
      const res = await apiRequest<{ message: string }>('/players/bulk', {
        method: 'POST',
        body: JSON.stringify({ players: validPlayers, teamId: bulkPlayerTeamId }),
      });
      alert(res.message);
      setShowBulkPlayerGridModal(false);
      fetchAll();
    } catch (err: any) {
      const targetTeam = teams.find((t) => t.id === bulkPlayerTeamId);
      const newPlayers: Player[] = validPlayers.map((vp, i) => ({
        id: `player-bulk-${Date.now()}-${i}`,
        name: vp.name,
        jerseyNumber: vp.jerseyNumber || Math.floor(Math.random() * 99) + 1,
        role: (vp.role || 'ALL_ROUNDER') as any,
        battingStyle: vp.battingStyle || 'Right-Handed',
        bowlingStyle: 'Right-Arm Fast',
        teamId: bulkPlayerTeamId,
        team: targetTeam,
      }));
      setPlayers((prev) => [...prev, ...newPlayers]);
      setShowBulkPlayerGridModal(false);
      alert(`Successfully added ${newPlayers.length} players!`);
    }
  };

  const handleSaveMatchGrid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkMatchTournamentId) return alert('Please select a target tournament!');
    const validMatches = matchGridRows.filter((r) => r.homeTeamId && r.awayTeamId);
    if (validMatches.length === 0) return alert('Please select home and away teams!');

    try {
      const res = await apiRequest<{ message: string }>('/matches/bulk', {
        method: 'POST',
        body: JSON.stringify({ matches: validMatches, tournamentId: bulkMatchTournamentId }),
      });
      alert(res.message);
      setShowBulkMatchGridModal(false);
      fetchAll();
    } catch (err: any) {
      const tournament = tournaments.find((t) => t.id === bulkMatchTournamentId);
      const newMatches: Match[] = validMatches.map((vm, i) => {
        const homeTeam = teams.find((t) => t.id === vm.homeTeamId)!;
        const awayTeam = teams.find((t) => t.id === vm.awayTeamId)!;
        return {
          id: `match-bulk-${Date.now()}-${i}`,
          tournamentId: bulkMatchTournamentId,
          tournament,
          homeTeamId: vm.homeTeamId,
          awayTeamId: vm.awayTeamId,
          homeTeam,
          awayTeam,
          stage: (vm.stage || 'LEAGUE') as any,
          matchNumber: matches.length + i + 1,
          status: 'UPCOMING',
          scheduledAt: vm.scheduledAt || new Date().toISOString(),
          venue: vm.venue || 'Stadium',
        };
      });
      setMatches((prev) => [...prev, ...newMatches]);
      setShowBulkMatchGridModal(false);
      alert(`Successfully scheduled ${newMatches.length} matches!`);
    }
  };

  const handleAutoGenerateFixtures = async (tId: string) => {
    try {
      const res = await apiRequest<{ message: string }>('/matches/auto-fixtures', {
        method: 'POST',
        body: JSON.stringify({ tournamentId: tId }),
      });
      alert(res.message);
      fetchAll();
    } catch (err: any) {
      if (teams.length < 2) return alert('At least 2 teams required to generate fixtures!');
      const newMatches: Match[] = [];
      let num = matches.length + 1;
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          newMatches.push({
            id: `match-auto-${Date.now()}-${num}`,
            tournamentId: tId,
            homeTeamId: teams[i].id,
            awayTeamId: teams[j].id,
            homeTeam: teams[i],
            awayTeam: teams[j],
            stage: 'LEAGUE',
            matchNumber: num++,
            status: 'UPCOMING',
            scheduledAt: new Date(Date.now() + num * 86400000).toISOString(),
            venue: 'Main Ground',
          });
        }
      }
      setMatches((prev) => [...prev, ...newMatches]);
      alert(`Generated ${newMatches.length} round-robin matches!`);
    }
  };

  // --- SINGLE TOURNAMENT HANDLERS ---
  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTournament) {
        await apiRequest(`/tournaments/${editingTournament.id}`, { method: 'PUT', body: JSON.stringify(tForm) });
      } else {
        await apiRequest('/tournaments', { method: 'POST', body: JSON.stringify(tForm) });
      }
      setShowTournamentModal(false);
      setEditingTournament(null);
      fetchAll();
    } catch (err: any) {
      if (editingTournament) {
        setTournaments((prev) =>
          prev.map((t) =>
            t.id === editingTournament.id
              ? { ...t, ...tForm, format: tForm.format as any, entryFee: Number(tForm.entryFee) }
              : t
          )
        );
      } else {
        const newT: Tournament = {
          id: `t-${Date.now()}`,
          title: tForm.title,
          slug: tForm.title.toLowerCase().replace(/\s+/g, '-'),
          description: tForm.description,
          format: (tForm.format || 'LEAGUE_KNOCKOUT') as any,
          overs: Number(tForm.overs) || 20,
          powerplayOvers: 6,
          ballType: tForm.ballType,
          ground: tForm.ground,
          city: tForm.city,
          startDate: tForm.startDate,
          endDate: tForm.endDate,
          entryFee: Number(tForm.entryFee) || 0,
          prizePool: tForm.prizePool,
          rules: tForm.rules,
          contactEmail: tForm.contactEmail,
          contactPhone: tForm.contactPhone,
          status: 'PUBLISHED',
        };
        setTournaments((prev) => [...prev, newT]);
      }
      setShowTournamentModal(false);
      setEditingTournament(null);
      alert('Tournament saved successfully!');
    }
  };

  const handleDeleteTournament = async (id: string) => {
    if (!confirm('Delete tournament?')) return;
    try {
      await apiRequest(`/tournaments/${id}`, { method: 'DELETE' });
      fetchAll();
    } catch (err: any) {
      setTournaments((prev) => prev.filter((t) => t.id !== id));
      alert('Tournament deleted!');
    }
  };

  // --- SINGLE TEAM HANDLERS ---
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        await apiRequest(`/teams/${editingTeam.id}`, { method: 'PUT', body: JSON.stringify(tmForm) });
      } else {
        await apiRequest('/teams', { method: 'POST', body: JSON.stringify(tmForm) });
      }
      setShowTeamModal(false);
      setEditingTeam(null);
      fetchAll();
    } catch (err: any) {
      if (editingTeam) {
        setTeams((prev) => prev.map((t) => (t.id === editingTeam.id ? { ...t, ...tmForm } : t)));
      } else {
        const newTeam: Team = {
          id: `team-${Date.now()}`,
          name: tmForm.name,
          shortName: tmForm.shortName.toUpperCase(),
          city: tmForm.city,
          captainName: tmForm.captainName,
        };
        setTeams((prev) => [...prev, newTeam]);
      }
      setShowTeamModal(false);
      setEditingTeam(null);
      alert('Team saved successfully!');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Delete team?')) return;
    try {
      await apiRequest(`/teams/${id}`, { method: 'DELETE' });
      fetchAll();
    } catch (err: any) {
      setTeams((prev) => prev.filter((t) => t.id !== id));
      alert('Team deleted!');
    }
  };

  // --- SINGLE PLAYER HANDLERS ---
  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlayer) {
        await apiRequest(`/players/${editingPlayer.id}`, { method: 'PUT', body: JSON.stringify(pForm) });
      } else {
        await apiRequest('/players', { method: 'POST', body: JSON.stringify(pForm) });
      }
      setShowPlayerModal(false);
      setEditingPlayer(null);
      fetchAll();
    } catch (err: any) {
      const team = teams.find((t) => t.id === pForm.teamId);
      if (editingPlayer) {
        setPlayers((prev) => prev.map((p) => (p.id === editingPlayer.id ? { ...p, ...pForm, role: pForm.role as any, team } : p)));
      } else {
        const newP: Player = {
          id: `player-${Date.now()}`,
          name: pForm.name,
          jerseyNumber: pForm.jerseyNumber,
          role: pForm.role as any,
          battingStyle: pForm.battingStyle,
          bowlingStyle: pForm.bowlingStyle,
          teamId: pForm.teamId,
          team,
        };
        setPlayers((prev) => [...prev, newP]);
      }
      setShowPlayerModal(false);
      setEditingPlayer(null);
      alert('Player saved successfully!');
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm('Delete player?')) return;
    try {
      await apiRequest(`/players/${id}`, { method: 'DELETE' });
      fetchAll();
    } catch (err: any) {
      setPlayers((prev) => prev.filter((p) => p.id !== id));
      alert('Player deleted!');
    }
  };

  // --- SINGLE MATCH HANDLERS ---
  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMatch) {
        await apiRequest(`/matches/${editingMatch.id}`, { method: 'PUT', body: JSON.stringify(mForm) });
      } else {
        await apiRequest('/matches', { method: 'POST', body: JSON.stringify(mForm) });
      }
      setShowMatchModal(false);
      setEditingMatch(null);
      fetchAll();
    } catch (err: any) {
      const homeTeam = teams.find((t) => t.id === mForm.homeTeamId)!;
      const awayTeam = teams.find((t) => t.id === mForm.awayTeamId)!;
      if (editingMatch) {
        setMatches((prev) => prev.map((m) => (m.id === editingMatch.id ? { ...m, stage: mForm.stage as any, scheduledAt: mForm.scheduledAt, venue: mForm.venue, homeTeam, awayTeam } : m)));
      } else {
        const newM: Match = {
          id: `match-${Date.now()}`,
          tournamentId: mForm.tournamentId,
          homeTeamId: mForm.homeTeamId,
          awayTeamId: mForm.awayTeamId,
          homeTeam,
          awayTeam,
          stage: mForm.stage as any,
          matchNumber: matches.length + 1,
          status: 'UPCOMING',
          scheduledAt: mForm.scheduledAt,
          venue: mForm.venue || 'Stadium',
        };
        setMatches((prev) => [...prev, newM]);
      }
      setShowMatchModal(false);
      setEditingMatch(null);
      alert('Match scheduled successfully!');
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Delete match?')) return;
    try {
      await apiRequest(`/matches/${id}`, { method: 'DELETE' });
      fetchAll();
    } catch (err: any) {
      setMatches((prev) => prev.filter((m) => m.id !== id));
      alert('Match deleted!');
    }
  };

  // --- RESULT HANDLER ---
  const handleSaveMatchResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultMatch) return;
    try {
      await apiRequest(`/matches/${resultMatch.id}`, {
        method: 'PUT',
        body: JSON.stringify(resForm),
      });
      setShowResultModal(false);
      setResultMatch(null);
      fetchAll();
    } catch (err: any) {
      const winnerTeam = teams.find((t) => t.id === resForm.winnerTeamId);
      const playerOfTheMatch = players.find((p) => p.id === resForm.playerOfTheMatchId);
      setMatches((prev) =>
        prev.map((m) => {
          if (m.id !== resultMatch.id) return m;
          return {
            ...m,
            status: resForm.status as any,
            stage: resForm.stage as any,
            tossWinnerId: resForm.tossWinnerId,
            tossDecision: resForm.tossDecision as any,
            winnerTeamId: resForm.winnerTeamId,
            winnerTeam,
            playerOfTheMatchId: resForm.playerOfTheMatchId,
            playerOfTheMatch,
            resultSummary: resForm.resultSummary,
            innings: [
              {
                id: `inn-1-${m.id}`,
                matchId: m.id,
                inningNumber: 1,
                battingTeamId: m.homeTeamId,
                bowlingTeamId: m.awayTeamId,
                totalRuns: resForm.homeScoreRuns,
                wickets: resForm.homeWickets,
                overs: resForm.homeOvers,
                wideExtras: 0,
                noBallExtras: 0,
                byeExtras: 0,
                legByeExtras: 0,
                isCompleted: true,
              },
              {
                id: `inn-2-${m.id}`,
                matchId: m.id,
                inningNumber: 2,
                battingTeamId: m.awayTeamId,
                bowlingTeamId: m.homeTeamId,
                totalRuns: resForm.awayScoreRuns,
                wickets: resForm.awayWickets,
                overs: resForm.awayOvers,
                wideExtras: 0,
                noBallExtras: 0,
                byeExtras: 0,
                legByeExtras: 0,
                isCompleted: true,
              },
            ],
          };
        })
      );
      setShowResultModal(false);
      setResultMatch(null);
      alert('Match score & result saved successfully!');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h1 className="text-2xl font-heading font-black text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-emerald-400" /> CricValley Admin Management Hub
          </h1>
          <p className="text-xs text-slate-400">CRUD for Tournaments, Teams, Players, Matches, and Man of the Match awards</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
          {[
            { id: 'tournaments', label: `Tournaments (${tournaments.length})`, icon: Trophy },
            { id: 'teams', label: `Teams (${teams.length})`, icon: Shield },
            { id: 'players', label: `Players (${players.length})`, icon: Users },
            { id: 'matches', label: `Matches & Results (${matches.length})`, icon: Calendar },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: TOURNAMENTS CRUD */}
      {activeTab === 'tournaments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-lg font-heading font-bold text-white">Tournament Management</h2>
            <button
              onClick={() => {
                setEditingTournament(null);
                setTForm({
                  title: '',
                  description: '',
                  format: 'LEAGUE_KNOCKOUT',
                  overs: 20,
                  ballType: 'Leather',
                  entryFee: 5000,
                  prizePool: '₹1,50,000 + Trophy & Medals',
                  city: 'Srinagar',
                  ground: 'Valley Sports Complex',
                  startDate: '2026-09-01',
                  endDate: '2026-09-25',
                  contactEmail: 'support@cricvalley.com',
                  contactPhone: '7780807508',
                  rules: 'Standard T20 Playing Conditions. 6 Overs Powerplay.',
                });
                setShowTournamentModal(true);
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> Add Tournament
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Title & Overview</th>
                  <th className="py-3 px-3">Format & Overs</th>
                  <th className="py-3 px-3">Prize Award Pool</th>
                  <th className="py-3 px-3">Entry Fee</th>
                  <th className="py-3 px-3">City / Ground</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {tournaments.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-white">
                      <div>{t.title}</div>
                      {t.description && <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">{t.description}</div>}
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-semibold">
                      {t.format.replace('_', ' ')} ({t.overs} Ov, {t.ballType || 'Leather'})
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-bold">
                      {t.prizePool || 'Trophy & Medals'}
                    </td>
                    <td className="py-3 px-3 text-cyan-400 font-mono font-bold">
                      {t.entryFee ? `₹${t.entryFee}` : 'Free'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{t.ground || 'Stadium'}, {t.city || 'Kashmir'}</td>
                    <td className="py-3 px-3 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingTournament(t);
                          setTForm({
                            title: t.title,
                            description: t.description || '',
                            format: t.format,
                            overs: t.overs,
                            ballType: t.ballType || 'Leather',
                            entryFee: t.entryFee || 5000,
                            prizePool: t.prizePool || '₹1,50,000 + Trophy',
                            city: t.city || 'Srinagar',
                            ground: t.ground || 'Valley Stadium',
                            startDate: t.startDate ? t.startDate.slice(0, 10) : '2026-09-01',
                            endDate: t.endDate ? t.endDate.slice(0, 10) : '2026-09-25',
                            contactEmail: t.contactEmail || 'support@cricvalley.com',
                            contactPhone: t.contactPhone || '7780807508',
                            rules: t.rules || 'Standard T20 Rules',
                          });
                          setShowTournamentModal(true);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTournament(t.id)}
                        className="p-1.5 bg-slate-800 hover:bg-red-950 text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TEAMS CRUD & BULK GRID */}
      {activeTab === 'teams' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
            <h2 className="text-lg font-heading font-bold text-white">Team Management</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkTeamGridModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Table className="w-4 h-4" /> Bulk Add Teams (Grid)
              </button>
              <button
                onClick={() => {
                  setEditingTeam(null);
                  setTmForm({ name: '', shortName: '', city: '', captainName: '', coachName: '' });
                  setShowTeamModal(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" /> Add Single Team
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teams.map((tm) => (
              <div key={tm.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-800">
                    {tm.shortName}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{tm.name}</div>
                    <div className="text-xs text-slate-400">Capt: {tm.captainName || 'TBD'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingTeam(tm);
                      setTmForm({ name: tm.name, shortName: tm.shortName, city: tm.city || '', captainName: tm.captainName || '', coachName: tm.coachName || '' });
                      setShowTeamModal(true);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(tm.id)}
                    className="p-1.5 bg-slate-800 hover:bg-red-950 text-red-400 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PLAYERS CRUD & BULK GRID */}
      {activeTab === 'players' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
            <h2 className="text-lg font-heading font-bold text-white">Player Management</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkPlayerGridModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Table className="w-4 h-4" /> Bulk Add Players (Grid)
              </button>
              <button
                onClick={() => {
                  setEditingPlayer(null);
                  setPForm({ name: '', jerseyNumber: 18, role: 'ALL_ROUNDER', battingStyle: 'Right-Handed', bowlingStyle: 'Right-Arm Fast', teamId: teams[0]?.id || '' });
                  setShowPlayerModal(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" /> Add Single Player
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Player</th>
                  <th className="py-3 px-3">Team</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Jersey #</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {players.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-white">{p.name}</td>
                    <td className="py-3 px-3 text-emerald-400 font-semibold">{p.team?.shortName || 'Free Agent'}</td>
                    <td className="py-3 px-3 text-slate-300">{p.role.replace('_', ' ')}</td>
                    <td className="py-3 px-3 text-amber-400 font-mono font-bold">#{p.jerseyNumber || '-'}</td>
                    <td className="py-3 px-3 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingPlayer(p);
                          setPForm({ name: p.name, jerseyNumber: p.jerseyNumber || 18, role: p.role, battingStyle: p.battingStyle, bowlingStyle: p.bowlingStyle, teamId: p.teamId || '' });
                          setShowPlayerModal(true);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(p.id)}
                        className="p-1.5 bg-slate-800 hover:bg-red-950 text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MATCHES, TAGS & MAN OF THE MATCH DECLARATION */}
      {activeTab === 'matches' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
            <div>
              <h2 className="text-lg font-heading font-bold text-white">Fixtures & Award Management</h2>
              <p className="text-xs text-slate-400">Set match stage tags (Quarter Final, Semi Final, Final), declare scores & Man of the Match</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkMatchGridModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Table className="w-4 h-4" /> Bulk Add Matches
              </button>
              <button
                onClick={() => {
                  if (tournaments.length > 0) handleAutoGenerateFixtures(tournaments[0].id);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Zap className="w-4 h-4" /> Auto Round-Robin
              </button>
              <button
                onClick={() => {
                  setEditingMatch(null);
                  if (tournaments.length > 0 && teams.length >= 2) {
                    setMForm({ tournamentId: tournaments[0].id, homeTeamId: teams[0].id, awayTeamId: teams[1].id, stage: 'LEAGUE', scheduledAt: '2026-08-15T18:00', venue: 'Main Ground' });
                  }
                  setShowMatchModal(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" /> Schedule Match
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Match Tag / Stage</th>
                  <th className="py-3 px-3">Teams</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Winner & Man of the Match</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {matches.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        m.stage === 'FINAL' ? 'bg-amber-950 text-amber-300 border-amber-600' : m.stage === 'SEMI_FINAL' ? 'bg-purple-950 text-purple-300 border-purple-600' : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {m.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {m.homeTeam.name} vs {m.awayTeam.name}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.status === 'LIVE' ? 'bg-amber-600 text-white' : m.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-300'}`}>
                        {m.status === 'LIVE' ? 'ONGOING' : m.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-amber-400 font-bold">
                        {m.winnerTeam ? `🏆 Winner: ${m.winnerTeam.name}` : m.resultSummary || '-'}
                      </div>
                      {m.playerOfTheMatch && (
                        <div className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1 mt-0.5">
                          <Award className="w-3.5 h-3.5" /> M.O.M: {m.playerOfTheMatch.name}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/streamer/${m.id}`}
                        className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-lg text-[11px] shadow-md flex items-center gap-1"
                      >
                        <Video className="w-3.5 h-3.5" /> Cam Stream
                      </Link>
                      <Link
                        to={`/admin/scorer/${m.id}`}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-lg text-[11px] shadow-md flex items-center gap-1"
                      >
                        <Activity className="w-3.5 h-3.5" /> Live Scorer
                      </Link>
                      <button
                        onClick={() => {
                          setResultMatch(m);
                          const matchedPlayers = players.filter((p) => p.teamId === m.homeTeamId || p.teamId === m.awayTeamId);
                          
                          const homeInn = m.innings?.find((i) => i.battingTeamId === m.homeTeamId) || m.innings?.find((i) => i.inningNumber === 1);
                          const awayInn = m.innings?.find((i) => i.battingTeamId === m.awayTeamId) || m.innings?.find((i) => i.inningNumber === 2);

                          const homeRuns = homeInn ? homeInn.totalRuns : 0;
                          const homeWkts = homeInn ? homeInn.wickets : 0;
                          const homeOvs = homeInn ? homeInn.overs : 0;

                          const awayRuns = awayInn ? awayInn.totalRuns : 0;
                          const awayWkts = awayInn ? awayInn.wickets : 0;
                          const awayOvs = awayInn ? awayInn.overs : 0;

                          let calculatedWinnerId = m.winnerTeamId || m.homeTeamId;
                          let calculatedSummary = m.resultSummary || '';

                          if (!calculatedSummary && (homeRuns > 0 || awayRuns > 0)) {
                            if (homeRuns > awayRuns) {
                              calculatedWinnerId = m.homeTeamId;
                              calculatedSummary = `${m.homeTeam.name} won by ${homeRuns - awayRuns} runs`;
                            } else if (awayRuns > homeRuns) {
                              calculatedWinnerId = m.awayTeamId;
                              calculatedSummary = `${m.awayTeam.name} won by ${10 - awayWkts} wickets`;
                            } else if (homeRuns > 0 && awayRuns === homeRuns) {
                              calculatedSummary = `Match Tied (Super Over)`;
                            }
                          }

                          setResForm({
                            status: m.status || 'COMPLETED',
                            stage: m.stage,
                            tossWinnerId: m.tossWinnerId || m.homeTeamId,
                            tossDecision: m.tossDecision || 'BAT',
                            winnerTeamId: calculatedWinnerId,
                            playerOfTheMatchId: m.playerOfTheMatchId || (matchedPlayers[0]?.id || ''),
                            resultSummary: calculatedSummary || `${m.homeTeam.shortName} vs ${m.awayTeam.shortName}`,
                            homeScoreRuns: homeRuns,
                            homeWickets: homeWkts,
                            homeOvers: homeOvs,
                            awayScoreRuns: awayRuns,
                            awayWickets: awayWkts,
                            awayOvers: awayOvs,
                          });
                          setShowResultModal(true);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black rounded-lg text-[11px] shadow-md flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Update Result & M.O.M
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(m.id)}
                        className="p-1.5 bg-slate-800 hover:bg-red-950 text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MATCH RESULT & MAN OF THE MATCH MODAL */}
      {showResultModal && resultMatch && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-heading font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Match Status & Result Management
              </h3>
              <button onClick={() => setShowResultModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs font-bold text-emerald-400">
              {resultMatch.homeTeam.name} vs {resultMatch.awayTeam.name}
            </p>

            <form onSubmit={handleSaveMatchResult} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Match Stage / Tag</label>
                  <select
                    value={resForm.stage}
                    onChange={(e) => setResForm({ ...resForm, stage: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-medium"
                  >
                    <option value="LEAGUE">Group / League Match</option>
                    <option value="QUARTER_FINAL">Quarter Final</option>
                    <option value="SEMI_FINAL">Semi Final</option>
                    <option value="FINAL">Final</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Set Match Status *</label>
                  <select
                    value={resForm.status}
                    onChange={(e) => setResForm({ ...resForm, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
                  >
                    <option value="LIVE">ONGOING (In Progress)</option>
                    <option value="COMPLETED">COMPLETED (Finished)</option>
                    <option value="UPCOMING">UPCOMING</option>
                  </select>
                </div>
              </div>

              {/* Toss Information */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  🪙 Toss Information & Decision:
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Toss Winner</label>
                    <select
                      value={resForm.tossWinnerId}
                      onChange={(e) => setResForm({ ...resForm, tossWinnerId: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-bold"
                    >
                      <option value={resultMatch.homeTeamId}>{resultMatch.homeTeam.name}</option>
                      <option value={resultMatch.awayTeamId}>{resultMatch.awayTeam.name}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Toss Decision</label>
                    <select
                      value={resForm.tossDecision}
                      onChange={(e) => setResForm({ ...resForm, tossDecision: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-bold"
                    >
                      <option value="BAT">Elected to BAT first</option>
                      <option value="BOWL">Elected to BOWL first</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ONGOING vs COMPLETED Dynamic Flow */}
              {resForm.status === 'LIVE' ? (
                <div className="bg-gradient-to-r from-amber-950/80 to-slate-950 p-4 rounded-2xl border border-amber-500/40 text-center space-y-2">
                  <div className="text-xs font-black text-amber-400 uppercase flex items-center justify-center gap-1.5">
                    <Circle className="w-2.5 h-2.5 fill-current text-red-500 animate-pulse" /> ONGOING Match Mode Active
                  </div>
                  <p className="text-xs text-slate-300">
                    No manual scores or winner entry needed! Open the <strong>Live Scorer Console</strong> to record ball-by-ball actions, boundaries, and wickets in real-time.
                  </p>
                  <Link
                    to={`/admin/scorer/${resultMatch.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg mt-1"
                  >
                    <Activity className="w-4 h-4" /> Open Live Scorer Console
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-2xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Scores automatically calculated from Live Scorer innings data. Adjust if needed:</span>
                  </div>

                  {/* Home Team Score */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-emerald-400 uppercase flex items-center justify-between">
                      <span>{resultMatch.homeTeam.name} Final Score:</span>
                      <span className="font-mono text-white text-xs">{resForm.homeScoreRuns}/{resForm.homeWickets} ({resForm.homeOvers} ov)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" placeholder="Runs" value={resForm.homeScoreRuns} onChange={(e) => setResForm({ ...resForm, homeScoreRuns: Number(e.target.value) })} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono font-bold" />
                      <input type="number" placeholder="Wickets" value={resForm.homeWickets} onChange={(e) => setResForm({ ...resForm, homeWickets: Number(e.target.value) })} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono font-bold" />
                      <input type="number" step="0.1" placeholder="Overs" value={resForm.homeOvers} onChange={(e) => setResForm({ ...resForm, homeOvers: Number(e.target.value) })} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono font-bold" />
                    </div>
                  </div>

                  {/* Away Team Score */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-emerald-400 uppercase flex items-center justify-between">
                      <span>{resultMatch.awayTeam.name} Final Score:</span>
                      <span className="font-mono text-white text-xs">{resForm.awayScoreRuns}/{resForm.awayWickets} ({resForm.awayOvers} ov)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" placeholder="Runs" value={resForm.awayScoreRuns} onChange={(e) => setResForm({ ...resForm, awayScoreRuns: Number(e.target.value) })} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono font-bold" />
                      <input type="number" placeholder="Wickets" value={resForm.awayWickets} onChange={(e) => setResForm({ ...resForm, awayWickets: Number(e.target.value) })} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono font-bold" />
                      <input type="number" step="0.1" placeholder="Overs" value={resForm.awayOvers} onChange={(e) => setResForm({ ...resForm, awayOvers: Number(e.target.value) })} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono font-bold" />
                    </div>
                  </div>

                  {/* Winner Selector */}
                  <div>
                    <label className="block text-xs font-bold text-amber-400 uppercase mb-1">Declared Winner Team</label>
                    <select
                      value={resForm.winnerTeamId}
                      onChange={(e) => setResForm({ ...resForm, winnerTeamId: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
                    >
                      <option value={resultMatch.homeTeamId}>{resultMatch.homeTeam.name}</option>
                      <option value={resultMatch.awayTeamId}>{resultMatch.awayTeam.name}</option>
                    </select>
                  </div>

                  {/* Result Summary Note */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Official Result Summary</label>
                    <input
                      type="text"
                      placeholder="e.g. Kolkata Knights won by 15 runs"
                      value={resForm.resultSummary}
                      onChange={(e) => setResForm({ ...resForm, resultSummary: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
                    />
                  </div>

                  {/* Man of the Match Selector */}
                  <div>
                    <label className="block text-xs font-bold text-emerald-400 uppercase mb-1 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Declare Player of the Match (M.O.M)
                    </label>
                    <select
                      value={resForm.playerOfTheMatchId}
                      onChange={(e) => setResForm({ ...resForm, playerOfTheMatchId: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
                    >
                      <option value="">-- Select Player of Match --</option>
                      {players
                        .filter((p) => p.teamId === resultMatch.homeTeamId || p.teamId === resultMatch.awayTeamId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.team?.shortName || 'Player'})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowResultModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg">Save Status & Result</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPREADSHEET GRID BULK ADD TEAMS MODAL */}
      {showBulkTeamGridModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-heading font-black text-white flex items-center gap-2">
                <Table className="w-5 h-5 text-amber-400" /> Bulk Add Teams (Spreadsheet Grid)
              </h3>
              <button onClick={() => setShowBulkTeamGridModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeamGrid} className="space-y-4">
              <div className="max-h-80 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950 p-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                      <th className="py-2 px-2">Team Name</th>
                      <th className="py-2 px-2">Short Code</th>
                      <th className="py-2 px-2">City</th>
                      <th className="py-2 px-2">Captain</th>
                      <th className="py-2 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {teamGridRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-1">
                          <input type="text" placeholder="e.g. Kolkata Knights" value={row.name} onChange={(e) => { const copy = [...teamGridRows]; copy[idx].name = e.target.value; setTeamGridRows(copy); }} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" />
                        </td>
                        <td className="p-1">
                          <input type="text" placeholder="KKR" value={row.shortName} onChange={(e) => { const copy = [...teamGridRows]; copy[idx].shortName = e.target.value; setTeamGridRows(copy); }} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono" />
                        </td>
                        <td className="p-1">
                          <input type="text" placeholder="City" value={row.city} onChange={(e) => { const copy = [...teamGridRows]; copy[idx].city = e.target.value; setTeamGridRows(copy); }} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" />
                        </td>
                        <td className="p-1">
                          <input type="text" placeholder="Captain" value={row.captainName} onChange={(e) => { const copy = [...teamGridRows]; copy[idx].captainName = e.target.value; setTeamGridRows(copy); }} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" />
                        </td>
                        <td className="p-1 text-center">
                          <button type="button" onClick={() => setTeamGridRows(teamGridRows.filter((_, i) => i !== idx))} className="p-1.5 text-slate-500 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setTeamGridRows([...teamGridRows, { name: '', shortName: '', city: '', captainName: '' }])} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" /> Add Row
                </button>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowBulkTeamGridModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs shadow-lg">Save Teams</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPREADSHEET GRID BULK ADD PLAYERS MODAL */}
      {showBulkPlayerGridModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-heading font-black text-white flex items-center gap-2">
                <Table className="w-5 h-5 text-amber-400" /> Bulk Add Players (Spreadsheet Grid)
              </h3>
              <button onClick={() => setShowBulkPlayerGridModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlayerGrid} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Target Team</label>
                <select value={bulkPlayerTeamId} onChange={(e) => setBulkPlayerTeamId(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold">
                  {teams.map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                </select>
              </div>

              <div className="max-h-80 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950 p-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                      <th className="py-2 px-2">Player Name</th>
                      <th className="py-2 px-2">Jersey #</th>
                      <th className="py-2 px-2">Role</th>
                      <th className="py-2 px-2">Batting Style</th>
                      <th className="py-2 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {playerGridRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-1">
                          <input type="text" placeholder="e.g. Shubman Gill" value={row.name} onChange={(e) => { const copy = [...playerGridRows]; copy[idx].name = e.target.value; setPlayerGridRows(copy); }} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" />
                        </td>
                        <td className="p-1">
                          <input type="number" placeholder="77" value={row.jerseyNumber} onChange={(e) => { const copy = [...playerGridRows]; copy[idx].jerseyNumber = Number(e.target.value); setPlayerGridRows(copy); }} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono" />
                        </td>
                        <td className="p-1">
                          <select value={row.role} onChange={(e) => { const copy = [...playerGridRows]; copy[idx].role = e.target.value; setPlayerGridRows(copy); }} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white">
                            <option value="BATSMAN">Batsman</option><option value="BOWLER">Bowler</option><option value="ALL_ROUNDER">All-Rounder</option><option value="WICKET_KEEPER">Wicket Keeper</option>
                          </select>
                        </td>
                        <td className="p-1">
                          <select value={row.battingStyle} onChange={(e) => { const copy = [...playerGridRows]; copy[idx].battingStyle = e.target.value; setPlayerGridRows(copy); }} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white">
                            <option value="Right-Handed">Right-Handed</option><option value="Left-Handed">Left-Handed</option>
                          </select>
                        </td>
                        <td className="p-1 text-center">
                          <button type="button" onClick={() => setPlayerGridRows(playerGridRows.filter((_, i) => i !== idx))} className="p-1.5 text-slate-500 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setPlayerGridRows([...playerGridRows, { name: '', jerseyNumber: Math.floor(Math.random() * 99) + 1, role: 'ALL_ROUNDER', battingStyle: 'Right-Handed' }])} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" /> Add Row
                </button>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowBulkPlayerGridModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs shadow-lg">Save Players</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPREADSHEET GRID BULK ADD MATCHES MODAL */}
      {showBulkMatchGridModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-heading font-black text-white flex items-center gap-2">
                <Table className="w-5 h-5 text-amber-400" /> Bulk Schedule Matches (Spreadsheet Grid)
              </h3>
              <button onClick={() => setShowBulkMatchGridModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMatchGrid} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Target Tournament</label>
                <select value={bulkMatchTournamentId} onChange={(e) => setBulkMatchTournamentId(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold">
                  {tournaments.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>

              <div className="max-h-80 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950 p-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                      <th className="py-2 px-2">Match Stage</th>
                      <th className="py-2 px-2">Home Team</th>
                      <th className="py-2 px-2">Away Team</th>
                      <th className="py-2 px-2">Venue</th>
                      <th className="py-2 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {matchGridRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-1">
                          <select value={row.stage} onChange={(e) => { const copy = [...matchGridRows]; copy[idx].stage = e.target.value; setMatchGridRows(copy); }} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white">
                            <option value="LEAGUE">League Match</option>
                            <option value="QUARTER_FINAL">Quarter Final</option>
                            <option value="SEMI_FINAL">Semi Final</option>
                            <option value="FINAL">Final</option>
                          </select>
                        </td>
                        <td className="p-1">
                          <select value={row.homeTeamId} onChange={(e) => { const copy = [...matchGridRows]; copy[idx].homeTeamId = e.target.value; setMatchGridRows(copy); }} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white">
                            {teams.map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                          </select>
                        </td>
                        <td className="p-1">
                          <select value={row.awayTeamId} onChange={(e) => { const copy = [...matchGridRows]; copy[idx].awayTeamId = e.target.value; setMatchGridRows(copy); }} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white">
                            {teams.map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                          </select>
                        </td>
                        <td className="p-1">
                          <input type="text" placeholder="Stadium" value={row.venue} onChange={(e) => { const copy = [...matchGridRows]; copy[idx].venue = e.target.value; setMatchGridRows(copy); }} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" />
                        </td>
                        <td className="p-1 text-center">
                          <button type="button" onClick={() => setMatchGridRows(matchGridRows.filter((_, i) => i !== idx))} className="p-1.5 text-slate-500 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setMatchGridRows([...matchGridRows, { homeTeamId: teams[0]?.id || '', awayTeamId: teams[1]?.id || '', stage: 'LEAGUE', venue: 'Main Stadium', scheduledAt: '2026-08-20T18:00' }])} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" /> Add Row
                </button>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowBulkMatchGridModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs shadow-lg">Schedule Matches</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE TOURNAMENT MODAL */}
      {showTournamentModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-heading font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> {editingTournament ? 'Edit Tournament Details' : 'Create New Tournament'}
              </h3>
              <button onClick={() => setShowTournamentModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTournament} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Tournament Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kashmir T20 Premier Cup 2026"
                  value={tForm.title}
                  onChange={(e) => setTForm({ ...tForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Tournament Overview & Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief overview of the league, participating zones, and tournament vision..."
                  value={tForm.description}
                  onChange={(e) => setTForm({ ...tForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Format, Overs, Ball Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Format *</label>
                  <select
                    value={tForm.format}
                    onChange={(e) => setTForm({ ...tForm, format: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-medium"
                  >
                    <option value="LEAGUE">League Matches Only</option>
                    <option value="KNOCKOUT">Knockout Tournament</option>
                    <option value="LEAGUE_KNOCKOUT">League + Knockout</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Overs Per Inning *</label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={tForm.overs}
                    onChange={(e) => setTForm({ ...tForm, overs: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Ball Type</label>
                  <select
                    value={tForm.ballType}
                    onChange={(e) => setTForm({ ...tForm, ballType: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="Leather">Leather Ball</option>
                    <option value="Tennis">Heavy Tennis Ball</option>
                    <option value="Synthetic">Synthetic Ball</option>
                  </select>
                </div>
              </div>

              {/* Prize Award & Entry Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Prize Award Pool Details</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹1,50,000 + Championship Trophy + Medals"
                    value={tForm.prizePool}
                    onChange={(e) => setTForm({ ...tForm, prizePool: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Team Entry Fee (₹)</label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={tForm.entryFee}
                    onChange={(e) => setTForm({ ...tForm, entryFee: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-cyan-300 font-mono font-bold"
                  />
                </div>
              </div>

              {/* City & Ground */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Srinagar"
                    value={tForm.city}
                    onChange={(e) => setTForm({ ...tForm, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Stadium / Ground Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Pinjoora Sports Stadium"
                    value={tForm.ground}
                    onChange={(e) => setTForm({ ...tForm, ground: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Start & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Tournament Start Date</label>
                  <input
                    type="date"
                    value={tForm.startDate}
                    onChange={(e) => setTForm({ ...tForm, startDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Tournament End Date</label>
                  <input
                    type="date"
                    value={tForm.endDate}
                    onChange={(e) => setTForm({ ...tForm, endDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Contact Email & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="riyazahmadganaie610@gmail.com"
                    value={tForm.contactEmail}
                    onChange={(e) => setTForm({ ...tForm, contactEmail: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Contact Mobile / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="7780807508"
                    value={tForm.contactPhone}
                    onChange={(e) => setTForm({ ...tForm, contactPhone: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Playing Conditions & Rules */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Rules & Tournament Playing Conditions</label>
                <textarea
                  rows={2}
                  placeholder="Powerplay overs, super over rules, boundary limits, match timings..."
                  value={tForm.rules}
                  onChange={(e) => setTForm({ ...tForm, rules: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTournamentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {editingTournament ? 'Save Changes' : 'Create Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE TEAM MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-heading font-extrabold text-white">{editingTeam ? 'Edit Team' : 'Add Team'}</h3>
            <form onSubmit={handleSaveTeam} className="space-y-3">
              <input type="text" required placeholder="Team Name" value={tmForm.name} onChange={(e) => setTmForm({ ...tmForm, name: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              <input type="text" required placeholder="Short Name" value={tmForm.shortName} onChange={(e) => setTmForm({ ...tmForm, shortName: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowTeamModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs">Save Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE PLAYER MODAL */}
      {showPlayerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-heading font-extrabold text-white">{editingPlayer ? 'Edit Player' : 'Add Player'}</h3>
            <form onSubmit={handleSavePlayer} className="space-y-3">
              <input type="text" required placeholder="Player Name" value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              <select value={pForm.teamId} onChange={(e) => setPForm({ ...pForm, teamId: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white">
                {teams.map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPlayerModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs">Save Player</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE MATCH MODAL */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-heading font-extrabold text-white">Schedule New Match</h3>
            <form onSubmit={handleSaveMatch} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Match Tag / Stage</label>
                <select value={mForm.stage} onChange={(e) => setMForm({ ...mForm, stage: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white">
                  <option value="LEAGUE">Group Stage / League Match</option>
                  <option value="QUARTER_FINAL">Quarter Final</option>
                  <option value="SEMI_FINAL">Semi Final</option>
                  <option value="FINAL">Final</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={mForm.homeTeamId} onChange={(e) => setMForm({ ...mForm, homeTeamId: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white">
                  {teams.map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                </select>
                <select value={mForm.awayTeamId} onChange={(e) => setMForm({ ...mForm, awayTeamId: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white">
                  {teams.map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowMatchModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs">Save Match</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
