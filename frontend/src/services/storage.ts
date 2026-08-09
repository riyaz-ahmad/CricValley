import { Tournament, Team, Player, Match } from '../types';

const INITIAL_TOURNAMENTS: Tournament[] = [];
const INITIAL_TEAMS: Team[] = [];
const INITIAL_PLAYERS: Player[] = [];
const INITIAL_MATCHES: Match[] = [];

// LocalStorage Persistence Keys & BroadcastChannel
const KEY_TOURNAMENTS = 'cricvalley_tournaments_v1';
const KEY_TEAMS = 'cricvalley_teams_v1';
const KEY_PLAYERS = 'cricvalley_players_v1';
const KEY_MATCHES = 'cricvalley_matches_v1';

export const liveMatchChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('cricvalley_live_match_channel')
  : null;

export const storage = {
  getTournaments: (): Tournament[] => {
    try {
      const data = localStorage.getItem(KEY_TOURNAMENTS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem(KEY_TOURNAMENTS, JSON.stringify(INITIAL_TOURNAMENTS));
    return INITIAL_TOURNAMENTS;
  },

  saveTournaments: (items: Tournament[]) => {
    localStorage.setItem(KEY_TOURNAMENTS, JSON.stringify(items));
  },

  getTeams: (): Team[] => {
    try {
      const data = localStorage.getItem(KEY_TEAMS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem(KEY_TEAMS, JSON.stringify(INITIAL_TEAMS));
    return INITIAL_TEAMS;
  },

  saveTeams: (items: Team[]) => {
    localStorage.setItem(KEY_TEAMS, JSON.stringify(items));
  },

  getPlayers: (): Player[] => {
    try {
      const data = localStorage.getItem(KEY_PLAYERS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem(KEY_PLAYERS, JSON.stringify(INITIAL_PLAYERS));
    return INITIAL_PLAYERS;
  },

  savePlayers: (items: Player[]) => {
    localStorage.setItem(KEY_PLAYERS, JSON.stringify(items));
  },

  getMatches: (): Match[] => {
    try {
      const data = localStorage.getItem(KEY_MATCHES);
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem(KEY_MATCHES, JSON.stringify(INITIAL_MATCHES));
    return INITIAL_MATCHES;
  },

  saveMatches: (items: Match[]) => {
    localStorage.setItem(KEY_MATCHES, JSON.stringify(items));
    try {
      if (liveMatchChannel) {
        liveMatchChannel.postMessage({ type: 'MATCHES_UPDATED', matches: items });
      }
      window.dispatchEvent(new Event('cricvalley_match_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  },

  clearAllData: () => {
    try {
      localStorage.removeItem(KEY_TOURNAMENTS);
      localStorage.removeItem(KEY_TEAMS);
      localStorage.removeItem(KEY_PLAYERS);
      localStorage.removeItem(KEY_MATCHES);
      localStorage.setItem(KEY_TOURNAMENTS, JSON.stringify([]));
      localStorage.setItem(KEY_TEAMS, JSON.stringify([]));
      localStorage.setItem(KEY_PLAYERS, JSON.stringify([]));
      localStorage.setItem(KEY_MATCHES, JSON.stringify([]));
      window.dispatchEvent(new Event('cricvalley_match_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  },
};
