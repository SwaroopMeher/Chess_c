'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { isAdminUser, supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Calendar, Users, Trophy } from 'lucide-react'

interface Player {
  id: string
  name: string
  lichess_username?: string
}

interface Match {
  id: string
  round: number
  white_player_id: string
  black_player_id: string
  white_player_name: string
  black_player_name: string
  result?: string
  scheduled_at?: string
}

export default function SchedulePage() {
  const { user } = useUser()
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const isAdmin = user?.primaryEmailAddress?.emailAddress
    ? isAdminUser(user.primaryEmailAddress.emailAddress)
    : false

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersResult, matchesResult] = await Promise.all([
          supabase.from('players').select('*').order('name'),
          supabase.from('matches').select('*').order('round', { ascending: true })
        ])

        if (playersResult.error) throw playersResult.error
        if (matchesResult.error) throw matchesResult.error

        setPlayers(playersResult.data as Player[])
        setMatches(matchesResult.data as Match[])
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load schedule data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Generate Round-Robin schedule
  const generateSchedule = async () => {
    if (players.length < 2) {
      toast.error('At least 2 players are required to generate a schedule')
      return
    }

    setGenerating(true)
    try {
      // Delete existing matches
      await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      const rounds = generateRoundRobinSchedule(players)
      const matchesToInsert = []

      for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
        const round = rounds[roundIndex]
        for (const match of round) {
          matchesToInsert.push({
            round: roundIndex + 1,
            white_player_id: match.white.id,
            black_player_id: match.black.id,
            white_player_name: match.white.name,
            black_player_name: match.black.name,
            scheduled_at: new Date().toISOString()
          })
        }
      }

      const { error } = await supabase.from('matches').insert(matchesToInsert)
      if (error) throw error

      // Refetch matches
      const { data: newMatches, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .order('round', { ascending: true })

      if (fetchError) throw fetchError
      setMatches(newMatches as Match[])

      toast.success(`Schedule generated! ${matchesToInsert.length} matches created.`)
    } catch (error) {
      console.error('Error generating schedule:', error)
      toast.error('Failed to generate schedule')
    } finally {
      setGenerating(false)
    }
  }

  // Round-Robin algorithm
  const generateRoundRobinSchedule = (players: Player[]) => {
    const playersCopy = [...players]
    
    // If odd number of players, add a "bye" player
    if (playersCopy.length % 2 === 1) {
      playersCopy.push({ id: 'bye', name: 'BYE' })
    }

    const numPlayers = playersCopy.length
    const numRounds = numPlayers - 1
    const matchesPerRound = numPlayers / 2

    const rounds = []

    for (let round = 0; round < numRounds; round++) {
      const roundMatches = []
      
      for (let match = 0; match < matchesPerRound; match++) {
        const home = (round + match) % (numPlayers - 1)
        const away = (numPlayers - 1 - match + round) % (numPlayers - 1)
        
        // Last player stays fixed
        if (match === 0) {
          const player1 = playersCopy[numPlayers - 1]
          const player2 = playersCopy[home]
          
          if (player1.id !== 'bye' && player2.id !== 'bye') {
            roundMatches.push({
              white: player1,
              black: player2
            })
          }
        } else {
          const player1 = playersCopy[home]
          const player2 = playersCopy[away]
          
          if (player1.id !== 'bye' && player2.id !== 'bye') {
            roundMatches.push({
              white: player1,
              black: player2
            })
          }
        }
      }
      
      if (roundMatches.length > 0) {
        rounds.push(roundMatches)
      }
    }

    return rounds
  }

  const getMatchesByRound = () => {
    const matchesByRound: { [key: number]: Match[] } = {}
    matches.forEach(match => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = []
      }
      matchesByRound[match.round].push(match)
    })
    return matchesByRound
  }

  const getResultBadge = (result?: string) => {
    if (!result) return <Badge variant="outline">Pending</Badge>
    
    switch (result) {
      case '1-0':
        return <Badge variant="default" className="bg-green-500">White Wins</Badge>
      case '0-1':
        return <Badge variant="default" className="bg-blue-500">Black Wins</Badge>
      case '1/2-1/2':
        return <Badge variant="secondary">Draw</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Schedule</h2>
          <p className="text-muted-foreground">
            View the tournament schedule and upcoming matches.
          </p>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const matchesByRound = getMatchesByRound()
  const hasMatches = matches.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tournament Schedule</h2>
          <p className="text-muted-foreground">
            {hasMatches ? 'Round-Robin tournament schedule' : 'Generate the tournament schedule'}
          </p>
        </div>
        {isAdmin && (
          <Button 
            onClick={generateSchedule} 
            disabled={generating || players.length < 2}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            {generating ? 'Generating...' : hasMatches ? 'Regenerate Schedule' : 'Generate Schedule'}
          </Button>
        )}
      </div>

      {!hasMatches ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Ready to Start?
            </CardTitle>
            <CardDescription>
              Generate the tournament schedule to begin the competition.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span>{players.length} players registered</span>
            </div>
            <p className="text-muted-foreground">
              {players.length < 2 
                ? 'At least 2 players are required to generate a schedule.'
                : `A Round-Robin schedule will be generated with ${(players.length * (players.length - 1)) / 2} total matches.`
              }
            </p>
            {!isAdmin && (
              <p className="text-sm text-amber-600">
                Only the tournament administrator can generate the schedule.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6">
            {Object.entries(matchesByRound)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([roundNum, roundMatches]) => (
              <Card key={roundNum}>
                <CardHeader>
                  <CardTitle>Round {roundNum}</CardTitle>
                  <CardDescription>
                    {roundMatches.filter(m => m.result).length} of {roundMatches.length} matches completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {roundMatches.map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                        <div className="flex items-center gap-3">
                          <div className="text-sm">
                            <span className="font-medium">{match.white_player_name}</span>
                            <span className="text-muted-foreground mx-2">vs</span>
                            <span className="font-medium">{match.black_player_name}</span>
                          </div>
                        </div>
                        {getResultBadge(match.result)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 