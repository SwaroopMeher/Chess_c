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
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Players</h2>
          <p className="text-muted-foreground">
            View players by tournament
          </p>
        </div>
        <div className="grid gap-6">
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Players</h2>
        <p className="text-muted-foreground">
          View players by tournament and their registration details
        </p>
      </div>

      <div className="space-y-6">
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
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        {tournament.name}
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" />
                          {registrationCount} registered
                        </Badge>
                        {tournament.is_active && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {tournament.description || `${tournament.format} tournament with ${tournament.total_rounds} rounds`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Format: {tournament.format}</span>
                      <span>•</span>
                      <span>Max Players: {tournament.max_players}</span>
                      <span>•</span>
                      <span>Rounds: {tournament.total_rounds}</span>
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
                          <div key={player.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{player.name}</p>
                                {player.lichess_username && (
                                  <p className="text-sm text-muted-foreground">@{player.lichess_username}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {player.lichess_username && (
                                <a
                                  href={`https://lichess.org/@/${player.lichess_username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  @{player.lichess_username}
                                </a>
                              )}
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