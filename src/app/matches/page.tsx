'use client'

import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useTournament } from '@/lib/tournament-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Trophy, Clock, CheckCircle, AlertCircle, Users, FileText, Info } from 'lucide-react'

export default function MatchesPage() {
  const { user } = useUser()
  const { state, getMatchesByTournament, getTournamentById, submitMatchResult, refreshData, isLoading } = useTournament()
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
  const [submittingResult, setSubmittingResult] = useState<string | null>(null)
  const [openModal, setOpenModal] = useState<string | null>(null)

  // Auto-select first active tournament if none selected, clear if selected is inactive
  React.useEffect(() => {
    const activeTournaments = state.tournaments.filter(t => t.is_active)
    
    if (!selectedTournamentId && activeTournaments.length > 0) {
      setSelectedTournamentId(activeTournaments[0].id)
    } else if (selectedTournamentId && !activeTournaments.some(t => t.id === selectedTournamentId)) {
      // If currently selected tournament is not active, clear selection
      setSelectedTournamentId(activeTournaments.length > 0 ? activeTournaments[0].id : '')
    }
  }, [state.tournaments, selectedTournamentId])

  const submitResult = async (matchId: string, result: string) => {
    setSubmittingResult(matchId)
    try {
      await submitMatchResult(matchId, result)
      setOpenModal(null) // Close the modal after successful submission
    } catch (error) {
      // Error is already handled by the context function
    } finally {
      setSubmittingResult(null)
    }
  }

  const canSubmitResult = (match: any) => {
    if (match.result) return false // Already has result
    
    const tournament = getTournamentById(selectedTournamentId)
    
    // Check if tournament exists and is active
    if (!tournament || !tournament.is_active) return false
    
    if (!user?.id) return false

    // Find the user's player record by Clerk user ID
    const userPlayer = state.players.find(player => player.id === user.id)
    
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

  const selectedTournament = getTournamentById(selectedTournamentId)
  const matches = selectedTournamentId ? getMatchesByTournament(selectedTournamentId) : []
  const activeTournaments = state.tournaments.filter(t => t.is_active)
  
  const getMatchesByStatus = () => {
    const pending = matches.filter(m => !m.result)
    const completed = matches.filter(m => m.result)
    return { pending, completed }
  }

  if (isLoading) {
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

  // Function to create dummy data for testing
  const createDummyData = async () => {
    try {
      // Create dummy players
      const dummyPlayers = [
        { name: 'Aditya', email: 'aditya@example.com', lichess_username: 'aditya_chess' },
        { name: 'Swaroop', email: 'swaroop@example.com', lichess_username: 'swaroop_chess' },
        { name: 'Priya', email: 'priya@example.com', lichess_username: 'priya_chess' },
        { name: 'Rahul', email: 'rahul@example.com', lichess_username: 'rahul_chess' }
      ]

      for (const player of dummyPlayers) {
        const { error } = await supabase
          .from('players')
          .insert([player])
          .select()
        
        if (error && !error.message.includes('duplicate')) {
          console.error('Error creating player:', error)
        }
      }

      // Create a dummy tournament if none exists
      if (activeTournaments.length === 0) {
        const { data: tournament, error: tournamentError } = await supabase
          .from('tournaments')
          .insert([{
            name: 'Test Tournament',
            description: 'A test tournament for development',
            format: 'Round Robin',
            max_players: 8,
            total_rounds: 3,
            created_by: 'admin'
          }])
          .select()
          .single()

        if (tournamentError && !tournamentError.message.includes('duplicate')) {
          console.error('Error creating tournament:', tournamentError)
        }
      }

      toast.success('Dummy data created! Refreshing data...')
      await refreshData()
    } catch (error) {
      console.error('Error creating dummy data:', error)
      toast.error('Failed to create dummy data')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Match Results</h2>
        <p className="text-muted-foreground">
          Submit and view match results by tournament.
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
            Choose a tournament to view its matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an active tournament" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              {activeTournaments.length === 0 ? (
                <div className="p-2 text-center text-muted-foreground text-sm">
                  No active tournaments available
                </div>
              ) : (
                activeTournaments.map((tournament) => (
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
                <span>Rounds: {selectedTournament.total_rounds}</span>
                <span>•</span>
                <span>Status: {selectedTournament.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tournament Rules Section */}
      {selectedTournament && (selectedTournament.rules || selectedTournament.format) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tournament Information
            </CardTitle>
            <CardDescription>
              Rules and format details for {selectedTournament.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Format Information */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Format: {selectedTournament.format}</h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    {selectedTournament.format === 'Round Robin' && (
                      <>
                        <p>• Every player plays against every other player exactly once</p>
                        <p>• Fair color distribution: players get equal opportunities as white and black</p>
                      </>
                    )}
                    {selectedTournament.format === 'Swiss' && (
                      <>
                        <p>• Players are paired based on performance and ratings</p>
                        <p>• Fair color distribution: alternating colors based on seeding</p>
                        <p>• Stronger players face stronger opponents as tournament progresses</p>
                        <p>• Total rounds: {selectedTournament.total_rounds}</p>
                      </>
                    )}
                    <p>• Max players: {selectedTournament.max_players}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Rules */}
            {selectedTournament.rules && (
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">Tournament Rules</h4>
                    <div className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                      {selectedTournament.rules}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTournaments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Tournaments</h3>
            <p className="text-muted-foreground text-center mb-4">
              There are no active tournaments available. Tournament admin needs to activate a tournament first.
            </p>
            <Button onClick={createDummyData} variant="outline">
              Create Test Data
            </Button>
          </CardContent>
        </Card>
      ) : !selectedTournamentId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a Tournament</h3>
            <p className="text-muted-foreground text-center">
              Choose an active tournament above to view its matches
            </p>
          </CardContent>
        </Card>
      ) : matches.length === 0 ? (
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
                          <Dialog open={openModal === match.id} onOpenChange={(open) => setOpenModal(open ? match.id : null)}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                disabled={submittingResult === match.id}
                              >
                                Submit Result
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Submit Match Result</DialogTitle>
                                <DialogDescription>
                                  Record the result for: <strong>{match.white_player_name}</strong> vs <strong>{match.black_player_name}</strong>
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-3 gap-4">
                                  <Button 
                                    variant="default" 
                                    className="bg-white text-black hover:bg-gray-100 border-2 border-gray-300 font-semibold min-h-[80px] px-2"
                                    onClick={() => submitResult(match.id, '1-0')}
                                    disabled={submittingResult === match.id}
                                  >
                                    {submittingResult === match.id ? (
                                      <div className="text-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mx-auto mb-1"></div>
                                        <div className="text-xs">Submitting...</div>
                                      </div>
                                    ) : (
                                      <div className="text-center w-full">
                                        <div className="text-xs opacity-75 mb-1">White</div>
                                        <div className="font-bold text-sm leading-tight mb-1 break-words">{match.white_player_name}</div>
                                        <div className="text-xs">Wins</div>
                                      </div>
                                    )}
                                  </Button>
                                  <Button 
                                    variant="secondary"
                                    className="bg-gray-500 text-white hover:bg-gray-600 font-semibold min-h-[80px] px-2"
                                    onClick={() => submitResult(match.id, '1/2-1/2')}
                                    disabled={submittingResult === match.id}
                                  >
                                    {submittingResult === match.id ? (
                                      <div className="text-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto mb-1"></div>
                                        <div className="text-xs">Submitting...</div>
                                      </div>
                                    ) : (
                                      <div className="text-center w-full">
                                        <div className="text-xs opacity-75 mb-1">Draw</div>
                                        <div className="font-bold text-sm leading-tight mb-1">½ - ½</div>
                                      </div>
                                    )}
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    className="bg-gray-800 text-white hover:bg-gray-700 border-2 border-gray-600 font-semibold min-h-[80px] px-2"
                                    onClick={() => submitResult(match.id, '0-1')}
                                    disabled={submittingResult === match.id}
                                  >
                                    {submittingResult === match.id ? (
                                      <div className="text-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto mb-1"></div>
                                        <div className="text-xs">Submitting...</div>
                                      </div>
                                    ) : (
                                      <div className="text-center w-full">
                                        <div className="text-xs opacity-75 mb-1">Black</div>
                                        <div className="font-bold text-sm leading-tight mb-1 break-words">{match.black_player_name}</div>
                                        <div className="text-xs">Wins</div>
                                      </div>
                                    )}
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