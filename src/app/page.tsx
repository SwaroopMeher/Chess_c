'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trophy, Users, Calendar, BarChart3 } from 'lucide-react'
import { useTournament } from '@/lib/tournament-context'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const { state, getPlayersByTournament, getMatchesByTournament, getTournamentById, isLoading } = useTournament()
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')

  // Auto-select first active tournament if none selected, or clear if no active tournaments
  React.useEffect(() => {
    const activeTournaments = state.tournaments.filter(t => t.is_active)
    
    if (!selectedTournamentId && activeTournaments.length > 0) {
      setSelectedTournamentId(activeTournaments[0].id)
    } else if (selectedTournamentId && !activeTournaments.some(t => t.id === selectedTournamentId)) {
      // If currently selected tournament is not active, clear selection
      setSelectedTournamentId(activeTournaments.length > 0 ? activeTournaments[0].id : '')
    }
  }, [state.tournaments, selectedTournamentId])

  // Get tournament-specific data
  const selectedTournament = getTournamentById(selectedTournamentId)
  const tournamentPlayers = selectedTournamentId ? getPlayersByTournament(selectedTournamentId) : []
  const tournamentMatches = selectedTournamentId ? getMatchesByTournament(selectedTournamentId) : []

  // Calculate stats from tournament data
  const registeredPlayers = tournamentPlayers?.length || 0
  const totalMatches = tournamentMatches?.length || 0
  const completedMatches = tournamentMatches?.filter(match => match.result !== null && match.result !== '' && match.result !== undefined)?.length || 0
  
  // Calculate current leader based on tournament match results
  const currentLeader = React.useMemo(() => {
    if (!tournamentPlayers || !tournamentMatches || tournamentPlayers.length === 0) return null

    const playerStats = tournamentPlayers.map(player => {
      const playerMatches = tournamentMatches.filter(match => 
        match.white_player_id === player.id || match.black_player_id === player.id
      ).filter(match => match.result !== null && match.result !== '' && match.result !== undefined)

      let wins = 0
      let draws = 0
      
      playerMatches.forEach(match => {
        if (match.result === '1-0') {
          if (match.white_player_id === player.id) wins++
        } else if (match.result === '0-1') {
          if (match.black_player_id === player.id) wins++
        } else if (match.result === '1/2-1/2') {
          draws++
        }
      })

      return {
        ...player,
        played: playerMatches.length,
        wins,
        draws,
        losses: playerMatches.length - wins - draws,
        points: wins + draws * 0.5
      }
    })

    // Sort by points (descending), then by wins (descending), then by games played (descending)
    const sortedStats = playerStats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.wins !== a.wins) return b.wins - a.wins
      return b.played - a.played
    })

    return sortedStats[0] || null
  }, [tournamentPlayers, tournamentMatches])

  const getTournamentStatus = (tournament: any) => {
    if (tournament.is_active) {
      return { label: 'Active', variant: 'default' as const }
    }
    if (!tournament.registration_open) {
      return { label: 'Registration Closed', variant: 'destructive' as const }
    }
    return { label: 'Open Registration', variant: 'secondary' as const }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tournament Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to the chess tournament management system
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
            Choose a tournament to view its detailed statistics and leaderboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a tournament" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              {state.tournaments.filter(t => t.is_active).length === 0 ? (
                <div className="p-2 text-center text-muted-foreground text-sm">
                  No active tournaments available
                </div>
              ) : (
                state.tournaments.filter(t => t.is_active).map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    <div className="flex items-center gap-2">
                      <span>{tournament.name}</span>
                      <Badge variant="default" className="text-xs">Active</Badge>
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
                <span>Players: {registeredPlayers}/{selectedTournament.max_players}</span>
                <span>•</span>
                <span>Status: {selectedTournament.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Players</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold sm:text-3xl">
              {isLoading ? <Skeleton className="h-6 sm:h-8 w-3/4" /> : (
                registeredPlayers
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total participants
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold sm:text-3xl">
              {isLoading ? <Skeleton className="h-6 sm:h-8 w-1/2" /> : (
                totalMatches
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedMatches} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold sm:text-3xl">
              {isLoading ? <Skeleton className="h-6 sm:h-8 w-1/2" /> : (
                `${totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Match completion
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Leader</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold sm:text-3xl">
              {isLoading ? <Skeleton className="h-6 sm:h-8 w-1/2" /> : (
                currentLeader ? currentLeader.name : 'TBD'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentLeader ? `${currentLeader.points} points` : 'No matches yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tournaments</CardTitle>
            <CardDescription>
              View all tournament statuses and information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : state.tournaments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No tournaments available
              </p>
            ) : (
              <div className="space-y-3">
                {state.tournaments.map((tournament) => {
                  const status = getTournamentStatus(tournament)
                  const playerCount = state.registrations.filter(r => r.tournament_id === tournament.id).length
                  
                  return (
                    <div key={tournament.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{tournament.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {playerCount} / {tournament.max_players} players • {tournament.format}
                        </div>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              {selectedTournament 
                ? `Latest matches for ${selectedTournament.name}`
                : 'Select a tournament to view recent activity'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !selectedTournament ? (
              <p className="text-center text-muted-foreground py-8">
                No active tournaments available
              </p>
            ) : (
              <div className="space-y-3">
                {tournamentMatches
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map((match) => (
                  <div key={match.id} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${match.result ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {match.white_player_name} vs {match.black_player_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Round {match.round} • {match.result ? `Result: ${match.result}` : 'Pending'}
                      </p>
                    </div>
                  </div>
                ))}
                {tournamentMatches.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No matches scheduled for this tournament
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}