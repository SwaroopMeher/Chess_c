'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users, Calendar, BarChart3 } from 'lucide-react'
import { useTournament } from '@/lib/tournament-context'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const { tournamentState, players, matches, isLoading } = useTournament()

  // Calculate stats from real data
  const registeredPlayers = players?.length || 0
  const totalMatches = matches?.length || 0
  const completedMatches = matches?.filter(match => match.result !== null && match.result !== '' && match.result !== undefined)?.length || 0
  
  // Calculate current leader based on match results
  const currentLeader = React.useMemo(() => {
    if (!players || !matches || players.length === 0) return null

    const playerStats = players.map(player => {
      const playerMatches = matches.filter(match => 
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

      const points = wins * 1 + draws * 0.5

      return {
        ...player,
        points,
        played: playerMatches.length
      }
    })

    return playerStats.reduce((leader, player) => {
      if (!leader || player.points > leader.points) {
        return player
      }
      return leader
    }, null as typeof playerStats[0] | null)
  }, [players, matches])

  return (
    <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome to the Chess Tournament Tracker
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Active Tournament
              </CardTitle>
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-6 sm:h-8 w-3/4" /> : (
                <>
                  <div className="text-lg sm:text-2xl font-bold truncate">{tournamentState?.tournament_format || 'None'}</div>
                  <p className="text-xs text-muted-foreground">
                    <Badge variant="secondary" className={`text-xs ${
                      tournamentState?.is_active 
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                        : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                    }`}>
                      {tournamentState?.is_active ? 'In Progress' : 'Not Started'}
                    </Badge>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Players
              </CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-6 sm:h-8 w-1/2" /> : (
                <div className="text-lg sm:text-2xl font-bold">{registeredPlayers}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Registered players
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Matches Played
              </CardTitle>
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-6 sm:h-8 w-1/2" /> : (
                <div className="text-lg sm:text-2xl font-bold">{completedMatches}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Out of {totalMatches} total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Current Leader
              </CardTitle>
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-6 sm:h-8 w-1/2" /> : (
                <>
                  <div className="text-lg sm:text-2xl font-bold">{currentLeader?.name || 'None'}</div>
                  <p className="text-xs text-muted-foreground">
                    {currentLeader?.points || 0} points
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
          <Card className="bg-background">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Recent Matches</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Latest completed games will appear here.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : completedMatches > 0 ? (
                <div className="space-y-2">
                  {matches?.filter(match => match.result !== null && match.result !== '' && match.result !== undefined)
                    .slice(-3)
                    .reverse()
                    .map((match, i) => (
                      <div key={match.id || i} className="text-sm flex justify-between items-center p-2 rounded bg-accent/20">
                        <div>
                          <span className="font-medium">{match.white_player_name}</span> vs{' '}
                          <span className="font-medium">{match.black_player_name}</span>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            match.result === '1-0' ? 'default' :
                            match.result === '0-1' ? 'default' :
                            'secondary'
                          } className={
                            match.result === '1-0' ? 'bg-green-500' :
                            match.result === '0-1' ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }>
                            {match.result === '1-0' ? 'White wins' :
                             match.result === '0-1' ? 'Black wins' :
                             'Draw'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No recent matches to display.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-background">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Common tournament actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground text-sm">• View the current leaderboard</p>
              <p className="text-muted-foreground text-sm">• Check upcoming matches</p>
              <p className="text-muted-foreground text-sm">• Submit match results</p>
              <p className="text-muted-foreground text-sm">• View tournament schedule</p>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
