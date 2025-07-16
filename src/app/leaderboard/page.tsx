'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useTournament } from '@/lib/tournament-context'
import { Trophy, Medal, Award, Crown, AlertCircle } from 'lucide-react'


interface PlayerStats {
  id: string
  name: string
  played: number
  wins: number
  draws: number
  losses: number
  points: number
}

export default function LeaderboardPage() {
  const { state, getPlayersByTournament, getMatchesByTournament, getTournamentById, isLoading } = useTournament()
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')

  // Auto-select first active tournament if none selected
  React.useEffect(() => {
    if (!selectedTournamentId && state.tournaments.length > 0) {
      const activeTournament = state.tournaments.find(t => t.is_active)
      if (activeTournament) {
        setSelectedTournamentId(activeTournament.id)
      } else if (state.tournaments.length > 0) {
        setSelectedTournamentId(state.tournaments[0].id)
      }
    }
  }, [state.tournaments, selectedTournamentId])

  const selectedTournament = getTournamentById(selectedTournamentId)
  const tournamentPlayers = selectedTournamentId ? getPlayersByTournament(selectedTournamentId) : []
  const tournamentMatches = selectedTournamentId ? getMatchesByTournament(selectedTournamentId) : []

  // Calculate leaderboard for selected tournament
  const leaderboard: PlayerStats[] = React.useMemo(() => {
    if (!tournamentPlayers || !tournamentMatches || tournamentPlayers.length === 0) return []

    const playerStats = tournamentPlayers.map(player => {
      const playerMatches = tournamentMatches.filter(match => 
        match.white_player_id === player.id || match.black_player_id === player.id
      ).filter(match => match.result !== null && match.result !== '' && match.result !== undefined)

      let wins = 0
      let draws = 0
      let losses = 0
      
      playerMatches.forEach(match => {
        if (match.result === '1-0') {
          if (match.white_player_id === player.id) wins++
          else losses++
        } else if (match.result === '0-1') {
          if (match.black_player_id === player.id) wins++
          else losses++
        } else if (match.result === '1/2-1/2') {
          draws++
        }
      })

      const points = wins * 1 + draws * 0.5

      return {
        id: player.id,
        name: player.name,
        played: playerMatches.length,
        wins,
        draws,
        losses,
        points
      }
    })

    // Sort by points (descending), then by wins, then by games played
    return playerStats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.wins !== a.wins) return b.wins - a.wins
      return b.played - a.played
    })
  }, [tournamentPlayers, tournamentMatches])

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <Trophy className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getRankBadge = (position: number) => {
    switch (position) {
      case 1:
        return <Badge className="bg-yellow-500 text-black">1st</Badge>
      case 2:
        return <Badge className="bg-gray-400 text-black">2nd</Badge>
      case 3:
        return <Badge className="bg-amber-600 text-white">3rd</Badge>
      default:
        return <Badge variant="outline">{position}th</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Leaderboard</h2>
        <p className="text-muted-foreground">
          Real-time tournament standings and player statistics.
        </p>
      </div>

      {/* Tournament Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Select Tournament
          </CardTitle>
          <CardDescription>
            Choose a tournament to view its leaderboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a tournament" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              {state.tournaments.length === 0 ? (
                <div className="p-2 text-center text-muted-foreground text-sm">
                  No tournaments available
                </div>
              ) : (
                state.tournaments.map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    <div className="flex items-center gap-2">
                      <span>{tournament.name}</span>
                      {tournament.is_active && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedTournament && (
            <div className="mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Format: {selectedTournament.format}</span>
                <span>•</span>
                <span>Players: {tournamentPlayers.length}/{selectedTournament.max_players}</span>
                <span>•</span>
                <span>Status: {selectedTournament.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Tournament Standings
            {selectedTournament && ` - ${selectedTournament.name}`}
          </CardTitle>
          <CardDescription>
            Rankings based on total points (Win = 1 point, Draw = 0.5 points)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : !selectedTournament ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Tournament</h3>
              <p className="text-muted-foreground">
                Choose a tournament above to view its leaderboard.
              </p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
              <p className="text-muted-foreground">
                The leaderboard will appear once matches are completed for {selectedTournament.name}.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg transition-colors hover:bg-accent/50 space-y-3 sm:space-y-0 ${
                    index === 0 ? 'bg-yellow-500/10 border-yellow-500/20' :
                    index === 1 ? 'bg-gray-400/10 border-gray-400/20' :
                    index === 2 ? 'bg-amber-600/10 border-amber-600/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                      {getRankIcon(index + 1)}
                      {getRankBadge(index + 1)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{player.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {player.played} games played
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:gap-4 lg:gap-6">
                    <div className="text-center">
                      <p className="text-lg sm:text-2xl font-bold text-primary">{player.points}</p>
                      <p className="text-xs text-muted-foreground">Points</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm sm:text-lg font-semibold text-green-600">{player.wins}</p>
                      <p className="text-xs text-muted-foreground">Wins</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm sm:text-lg font-semibold text-yellow-600">{player.draws}</p>
                      <p className="text-xs text-muted-foreground">Draws</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm sm:text-lg font-semibold text-red-600">{player.losses}</p>
                      <p className="text-xs text-muted-foreground">Losses</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 