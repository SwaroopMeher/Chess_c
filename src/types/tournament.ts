export interface Player {
  id: string
  name: string
  lichessUsername?: string
  createdAt: string
  updatedAt: string
}

export interface TournamentState {
  id: string
  isActive: boolean
  registrationClosed: boolean
  tournamentFormat: string
  createdAt: string
  updatedAt: string
}

export interface Match {
  id: string
  whitePlayerId: string
  blackPlayerId: string
  whitePlayerName: string
  blackPlayerName: string
  round: number
  result?: string
  status: 'pending' | 'completed'
  createdAt: string
  updatedAt: string
}

export interface MatchResult {
  id: string
  matchId: string
  result: 'white_wins' | 'black_wins' | 'draw'
  reportedBy: string
  reporterName: string
  status: 'pending' | 'confirmed' | 'disputed'
  createdAt: string
  updatedAt: string
}

export interface LeaderboardEntry {
  playerId: string
  playerName: string
  played: number
  wins: number
  losses: number
  draws: number
  points: number
  rank: number
}

export interface TournamentFormat {
  id: string
  name: string
  description: string
  maxPlayers?: number
  minPlayers?: number
  rounds?: number
}

export const TOURNAMENT_FORMATS: TournamentFormat[] = [
  {
    id: 'round_robin',
    name: 'Round Robin',
    description: 'Everyone plays everyone else once',
    minPlayers: 3,
    maxPlayers: 16
  },
  {
    id: 'swiss',
    name: 'Swiss System',
    description: 'Players paired based on scores and ratings',
    minPlayers: 4,
    maxPlayers: 50
  },
  {
    id: 'elimination',
    name: 'Single Elimination',
    description: 'Knockout tournament format',
    minPlayers: 4,
    maxPlayers: 32
  }
] 