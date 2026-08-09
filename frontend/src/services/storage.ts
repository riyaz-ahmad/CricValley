import { Tournament, Team, Player, Match } from '../types';

const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 't1',
    title: 'CricValley Champions Trophy 2026',
    slug: 'cricvalley-champions-trophy-2026',
    format: 'LEAGUE_KNOCKOUT',
    overs: 20,
    powerplayOvers: 6,
    ballType: 'Leather',
    ground: 'Valley Cricket Stadium',
    city: 'Srinagar',
    startDate: '2026-08-01',
    endDate: '2026-08-20',
    entryFee: 5000,
    prizePool: '₹1,50,000',
    status: 'PUBLISHED',
    _count: { teams: 4, matches: 6 },
  },
  {
    id: 't2',
    title: 'Kashmir T20 Premier League',
    slug: 'kashmir-t20-premier-league',
    format: 'LEAGUE',
    overs: 20,
    powerplayOvers: 6,
    ballType: 'Leather',
    ground: 'Pinjoora Sports Ground',
    city: 'Shopian',
    startDate: '2026-09-01',
    endDate: '2026-09-25',
    entryFee: 8000,
    prizePool: '₹2,50,000',
    status: 'PUBLISHED',
    _count: { teams: 6, matches: 15 },
  },
];

const INITIAL_TEAMS: Team[] = [
  {
    id: 'team1',
    name: 'Srinagar Strikers',
    shortName: 'SRS',
    city: 'Srinagar',
    captainName: 'Ahmad Bhat',
    coachName: 'Tariq Dar',
    _count: { players: 5 },
  },
  {
    id: 'team2',
    name: 'Pinjoora Panthers',
    shortName: 'PJP',
    city: 'Shopian',
    captainName: 'Riyaz Ahmad',
    coachName: 'Farooq Malik',
    _count: { players: 5 },
  },
  {
    id: 'team3',
    name: 'Anantnag Royals',
    shortName: 'ANG',
    city: 'Anantnag',
    captainName: 'Zubair Lone',
    coachName: 'Shabir Shah',
    _count: { players: 4 },
  },
  {
    id: 'team4',
    name: 'Baramulla Warriors',
    shortName: 'BMW',
    city: 'Baramulla',
    captainName: 'Sameer Khan',
    coachName: 'Bilal Rather',
    _count: { players: 4 },
  },
];

const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p1',
    name: 'Riyaz Ahmad',
    jerseyNumber: 7,
    role: 'ALL_ROUNDER',
    battingStyle: 'Right-Handed',
    bowlingStyle: 'Right-Arm Fast',
    teamId: 'team2',
    team: INITIAL_TEAMS[1],
  },
  {
    id: 'p2',
    name: 'Ahmad Bhat',
    jerseyNumber: 18,
    role: 'BATSMAN',
    battingStyle: 'Right-Handed',
    bowlingStyle: 'Right-Arm Medium',
    teamId: 'team1',
    team: INITIAL_TEAMS[0],
  },
  {
    id: 'p3',
    name: 'Zubair Lone',
    jerseyNumber: 10,
    role: 'BOWLER',
    battingStyle: 'Left-Handed',
    bowlingStyle: 'Left-Arm Spin',
    teamId: 'team3',
    team: INITIAL_TEAMS[2],
  },
  {
    id: 'p4',
    name: 'Sameer Khan',
    jerseyNumber: 99,
    role: 'WICKET_KEEPER',
    battingStyle: 'Right-Handed',
    bowlingStyle: 'Right-Arm Medium',
    teamId: 'team4',
    team: INITIAL_TEAMS[3],
  },
];

const INITIAL_MATCHES: Match[] = [
  {
    id: 'm1',
    tournamentId: 't1',
    tournament: INITIAL_TOURNAMENTS[0],
    homeTeamId: 'team1',
    awayTeamId: 'team2',
    homeTeam: INITIAL_TEAMS[0],
    awayTeam: INITIAL_TEAMS[1],
    winnerTeamId: 'team2',
    winnerTeam: INITIAL_TEAMS[1],
    playerOfTheMatchId: 'p1',
    playerOfTheMatch: INITIAL_PLAYERS[0],
    matchNumber: 1,
    stage: 'FINAL',
    status: 'COMPLETED',
    scheduledAt: '2026-08-07T14:00:00.000Z',
    venue: 'Valley Cricket Stadium',
    resultSummary: 'Pinjoora Panthers won by 12 runs',
    innings: [
      {
        id: 'inn1',
        matchId: 'm1',
        inningNumber: 1,
        battingTeamId: 'team2',
        bowlingTeamId: 'team1',
        totalRuns: 185,
        wickets: 5,
        overs: 20,
        wideExtras: 4,
        noBallExtras: 1,
        byeExtras: 2,
        legByeExtras: 1,
        isCompleted: true,
      },
      {
        id: 'inn2',
        matchId: 'm1',
        inningNumber: 2,
        battingTeamId: 'team1',
        bowlingTeamId: 'team2',
        totalRuns: 173,
        wickets: 8,
        overs: 20,
        wideExtras: 5,
        noBallExtras: 2,
        byeExtras: 1,
        legByeExtras: 0,
        isCompleted: true,
      },
    ],
  },
  {
    id: 'm2',
    tournamentId: 't1',
    tournament: INITIAL_TOURNAMENTS[0],
    homeTeamId: 'team3',
    awayTeamId: 'team4',
    homeTeam: INITIAL_TEAMS[2],
    awayTeam: INITIAL_TEAMS[3],
    matchNumber: 2,
    stage: 'SEMI_FINAL',
    status: 'LIVE',
    scheduledAt: '2026-08-07T18:00:00.000Z',
    venue: 'Pinjoora Sports Ground',
    innings: [
      {
        id: 'inn3',
        matchId: 'm2',
        inningNumber: 1,
        battingTeamId: 'team3',
        bowlingTeamId: 'team4',
        totalRuns: 162,
        wickets: 6,
        overs: 20,
        wideExtras: 3,
        noBallExtras: 1,
        byeExtras: 0,
        legByeExtras: 2,
        isCompleted: true,
      },
      {
        id: 'inn4',
        matchId: 'm2',
        inningNumber: 2,
        battingTeamId: 'team4',
        bowlingTeamId: 'team3',
        totalRuns: 110,
        wickets: 4,
        overs: 13.4,
        wideExtras: 2,
        noBallExtras: 0,
        byeExtras: 1,
        legByeExtras: 1,
        isCompleted: false,
      },
    ],
  },
];

// LocalStorage Persistence Keys
const KEY_TOURNAMENTS = 'cricvalley_tournaments_v1';
const KEY_TEAMS = 'cricvalley_teams_v1';
const KEY_PLAYERS = 'cricvalley_players_v1';
const KEY_MATCHES = 'cricvalley_matches_v1';

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
      window.dispatchEvent(new Event('cricvalley_match_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  },
};
