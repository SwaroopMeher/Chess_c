'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useTournament } from '@/lib/tournament-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Trophy, Clock, CheckCircle, AlertCircle } from 'lucide-react'

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

export default function MatchesPage() {
  const { user } = useUser()
  const { tournamentState } = useTournament()
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Array<{ id: string; name?: string; [key: string]: unknown }>>([])
  const [loading, setLoading] = useState(true)
  const [submittingResult, setSubmittingResult] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesResult, playersResult] = await Promise.all([
          supabase.from('matches').select('*').order('round', { ascending: true }),
          supabase.from('players').select('*')
        ])

        if (matchesResult.error) throw matchesResult.error
        if (playersResult.error) throw playersResult.error
        
        setMatches(matchesResult.data as Match[])
        setPlayers(playersResult.data || [])
      } catch {
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscription for match updates
    const subscription = supabase
      .channel('matches-page-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'matches' }, 
        () => {
          fetchData() // Refetch matches on any change
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const submitResult = async (matchId: string, result: string) => {
    setSubmittingResult(matchId)
    try {
      // Update match result
      const { error: matchError } = await supabase
        .from('matches')
        .update({ result })
        .eq('id', matchId)

      if (matchError) throw matchError

      toast.success('Match result submitted successfully!')
      
      // Refetch matches to show updated state
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('round', { ascending: true })

      if (error) throw error
      setMatches(data as Match[])

    } catch {
      toast.error('Failed to submit result')
    } finally {
      setSubmittingResult(null)
    }
  }

  const canSubmitResult = (match: Match) => {
    if (match.result) return false // Already has result
    
    // Check if tournament is active
    if (!tournamentState.is_active) return false
    
    if (!user?.id) return false

    // Find the user's player record by Clerk user ID
    const userPlayer = players.find(player => player.id === user.id)
    
    if (!userPlayer) return false

    // User can only submit if they are one of the players in the match
    return match.white_player_id === userPlayer.id || match.black_player_id === userPlayer.id
  }

  const getResultBadge = (result?: string) => {
    if (!result) return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>
    
    switch (result) {
      case '1-0':
        return <Badge variant="default" className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" />White Wins</Badge>
      case '0-1':
        return <Badge variant="default" className="bg-blue-500 gap-1"><CheckCircle className="h-3 w-3" />Black Wins</Badge>
      case '1/2-1/2':
        return <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" />Draw</Badge>
      default:
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>
    }
  }

  const getMatchesByStatus = () => {
    const pending: Match[] = matches.filter(m => !m.result)
    const completed: Match[] = matches.filter(m => m.result)
    return { pending, completed }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Matches</h2>
          <p className="text-muted-foreground">
            Submit and view match results.
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

  const { pending, completed } = getMatchesByStatus()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Match Results</h2>
        <p className="text-muted-foreground">
          Submit and view match results for the tournament.
        </p>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              No Matches Yet
            </CardTitle>
            <CardDescription>
              The tournament schedule hasn&apos;t been generated yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Once the tournament administrator generates the schedule, matches will appear here for result submission.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending Matches */}
          {pending.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Pending Matches ({pending.length})
                </CardTitle>
                <CardDescription>
                  Matches waiting for results to be submitted.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {pending.map((match) => (
                    <div key={match.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg bg-background hover:bg-accent/50 transition-colors space-y-3 sm:space-y-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                        <Badge variant="outline" className="self-start">Round {match.round}</Badge>
                        <div className="text-sm min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-medium truncate">{match.white_player_name}</span>
                            <span className="text-muted-foreground text-xs sm:text-sm">vs</span>
                            <span className="font-medium truncate">{match.black_player_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        {getResultBadge(match.result)}
                        {canSubmitResult(match) && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                disabled={submittingResult === match.id}
                              >
                                Submit Result
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Submit Match Result</DialogTitle>
                                <DialogDescription>
                                  Record the result for: <strong>{match.white_player_name}</strong> vs <strong>{match.black_player_name}</strong>
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-3 gap-3">
                                  <Button 
                                    variant="default" 
                                    className="bg-green-500 hover:bg-green-600"
                                    onClick={() => submitResult(match.id, '1-0')}
                                    disabled={submittingResult === match.id}
                                  >
                                    White Wins
                                  </Button>
                                  <Button 
                                    variant="secondary"
                                    onClick={() => submitResult(match.id, '1/2-1/2')}
                                    disabled={submittingResult === match.id}
                                  >
                                    Draw
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    className="bg-blue-500 hover:bg-blue-600"
                                    onClick={() => submitResult(match.id, '0-1')}
                                    disabled={submittingResult === match.id}
                                  >
                                    Black Wins
                                  </Button>
                                </div>
                              </div>
                              <DialogFooter>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Matches */}
          {completed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-green-500" />
                  Completed Matches ({completed.length})
                </CardTitle>
                <CardDescription>
                  Matches with submitted results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {completed.map((match) => (
                    <div key={match.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg bg-background space-y-3 sm:space-y-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                        <Badge variant="outline" className="self-start">Round {match.round}</Badge>
                        <div className="text-sm min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-medium truncate">{match.white_player_name}</span>
                            <span className="text-muted-foreground text-xs sm:text-sm">vs</span>
                            <span className="font-medium truncate">{match.black_player_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        {getResultBadge(match.result)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
} 