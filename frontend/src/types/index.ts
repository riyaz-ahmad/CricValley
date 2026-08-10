export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SCORER' | 'ORGANIZER';
}

export interface Tournament {
  id: string;
  title: string;
  slug: string;
  description?: string;
  format: 'LEAGUE' | 'KNOCKOUT' | 'LEAGUE_KNOCKOUT' | 'ROUND_ROBIN';
  overs: number;
  powerplayOvers: number;
  ballType: string;
  ground?: string;
  city?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  entryFee: number;
  prizePool?: string;
  logoUrl?: string;
  bannerUrl?: string;
  rules?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'ARCHIVED';
  teams?: TournamentTeam[];
  matches?: Match[];
  announcements?: Announcement[];
  sponsors?: Sponsor[];
  gallery?: GalleryItem[];
  _count?: {
    teams: number;
    matches: number;
  };
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  bannerUrl?: string;
  city?: string;
  foundedYear?: number;
  captainName?: string;
  viceCaptain?: string;
  coachName?: string;
  managerName?: string;
  bio?: string;
  players?: Player[];
  _count?: {
    players: number;
  };
  statsSummary?: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    ties: number;
    noResults: number;
    points: number;
  };
}

export interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  role: 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKET_KEEPER';
  battingStyle: string;
  bowlingStyle: string;
  photoUrl?: string;
  dob?: string;
  mobile?: string;
  teamId?: string;
  team?: Team;
  careerStats?: {
    totalRuns: number;
    ballsFaced: number;
    fours: number;
    sixes: number;
    battingAvg: number;
    strikeRate: number;
    totalWickets: number;
    runsConceded: number;
    oversBowled: number;
    economy: number;
    bowlingAvg: number;
    playerOfMatchCount: number;
  };
}

export interface TournamentTeam {
  id: string;
  tournamentId: string;
  teamId: string;
  team: Team;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  noResults: number;
  points: number;
  netRunRate: number;
  runsScored: number;
  oversFaced: number;
  runsConceded: number;
  oversBowled: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  tournament?: Tournament;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: Team;
  awayTeam: Team;
  winnerTeamId?: string;
  winnerTeam?: Team;
  playerOfTheMatchId?: string;
  playerOfTheMatch?: Player;
  matchNumber: number;
  stage: 'LEAGUE' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';
  status: 'UPCOMING' | 'LIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string;
  venue?: string;
  umpire1?: string;
  umpire2?: string;
  scorer?: string;
  tossWinnerId?: string;
  tossDecision?: 'BAT' | 'BOWL';
  resultSummary?: string;
  targetRuns?: number;
  innings?: Innings[];
  formattedInnings?: FormattedInnings[];
}

export interface Innings {
  id: string;
  matchId: string;
  inningNumber: number;
  battingTeamId: string;
  bowlingTeamId: string;
  battingTeam?: Team;
  bowlingTeam?: Team;
  totalRuns: number;
  wickets: number;
  overs: number;
  wideExtras: number;
  noBallExtras: number;
  byeExtras: number;
  legByeExtras: number;
  isCompleted: boolean;
  currentStrikerId?: string;
  currentNonStrikerId?: string;
  currentBowlerId?: string;
  balls?: BallEvent[];
}

export interface FormattedInnings extends Innings {
  battingScorecard: {
    player: Player;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
    dismissal: string;
  }[];
  bowlingScorecard: {
    player: Player;
    legalBalls: number;
    oversFormatted: string;
    runsConceded: number;
    wickets: number;
    economy: number;
  }[];
  fallOfWickets: {
    score: number;
    wicket: number;
    overs: string;
    player: string;
  }[];
  scoreWormData: {
    over: number;
    runs: number;
  }[];
}

export interface BallEvent {
  id: string;
  inningsId: string;
  overNumber: number;
  ballNumberInOver: number;
  bowlerId: string;
  strikerId: string;
  nonStrikerId: string;
  runs: number;
  extraType: 'NONE' | 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE';
  extraRuns: number;
  isWicket: boolean;
  wicketType?: string;
  dismissedPlayerId?: string;
  fielderId?: string;
  commentary?: string;
  wagonWheelAngle?: number;
  wagonWheelZone?: string;
  timestamp: string;
  bowler?: Player;
  striker?: Player;
  nonStriker?: Player;
  dismissedPlayer?: Player;
  fielder?: Player;
}

export interface Announcement {
  id: string;
  tournamentId: string;
  title: string;
  content: string;
  isImportant: boolean;
  createdAt: string;
}

export interface Sponsor {
  id: string;
  tournamentId: string;
  name: string;
  tier: 'TITLE' | 'POWERED_BY' | 'ASSOCIATE' | 'MEDIA';
  logoUrl?: string;
  websiteUrl?: string;
}

export interface GalleryItem {
  id: string;
  tournamentId: string;
  title?: string;
  imageUrl: string;
  category: 'MATCH' | 'CEREMONY' | 'TEAMS' | 'HIGHLIGHTS';
  createdAt: string;
}
