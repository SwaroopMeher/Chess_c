'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useTournament } from '@/lib/tournament-context'
import { Trophy, Users, ExternalLink } from 'lucide-react'

export default function PlayersPage() {
  const { state, getPlayersByTournament, isLoading } = useTournament()

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Players</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            View players by tournament
          </p>
        </div>
        <div className="grid gap-4 sm:gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Players</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          View players by tournament and their registration details
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {state.tournaments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tournaments available</h3>
              <p className="text-muted-foreground text-center">
                No tournaments found to display players
              </p>
            </CardContent>
          </Card>
        ) : (
          state.tournaments.map((tournament) => {
            const players = getPlayersByTournament(tournament.id)
            const registrationCount = state.registrations.filter(r => r.tournament_id === tournament.id).length
            
            return (
              <Card key={tournament.id}>
                <CardHeader>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Trophy className="h-5 w-5 flex-shrink-0" />
                      <CardTitle className="flex-1 min-w-0">{tournament.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="gap-1 flex-shrink-0">
                        <Users className="h-3 w-3" />
                        {registrationCount} registered
                      </Badge>
                      {tournament.is_active && (
                        <Badge variant="default" className="flex-shrink-0">Active</Badge>
                      )}
                    </div>
                    <CardDescription className="break-words">
                      {tournament.description || `${tournament.format} tournament with ${tournament.total_rounds} rounds`}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                      <span className="flex-shrink-0">Format: {tournament.format}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex-shrink-0">Max Players: {tournament.max_players}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex-shrink-0">Rounds: {tournament.total_rounds}</span>
                    </div>
                  </div>
                  
                  {players.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No players registered for this tournament</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-medium">Registered Players ({players.length})</h4>
                      <div className="grid gap-2">
                        {players.map((player, index) => (
                          <div key={player.id} className="p-3 rounded-lg border bg-card">
                            <div className="flex items-start gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <p className="font-medium truncate">{player.name}</p>
                                  {player.lichess_username && (
                                    <a
                                      href={`https://lichess.org/@/${player.lichess_username}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary flex-shrink-0"
                                      title={`View @${player.lichess_username} on Lichess`}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      <span className="hidden sm:inline">@{player.lichess_username}</span>
                                      <span className="sm:hidden">Lichess</span>
                                    </a>
                                  )}
                                </div>
                                {player.lichess_username && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    @{player.lichess_username}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
} 