'use client'

import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { isAdminUser } from '@/lib/supabase'
import { useTournament } from '@/lib/tournament-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar, Users, Trophy, AlertCircle, FileText, Info, RefreshCw } from 'lucide-react'

export default function SchedulePage() {
  const { user } = useUser()
  const { state, getMatchesByTournament, getTournamentById, getPlayersByTournament, activateTournament, regenerateSchedule, isLoading } = useTournament()
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
  const [isRegenerating, setIsRegenerating] = useState(false)

  const isAdmin = user?.primaryEmailAddress?.emailAddress
    ? isAdminUser(user.primaryEmailAddress.emailAddress)
    : false

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

  const selectedTournament = getTournamentById(selectedTournamentId)
  const players = selectedTournamentId ? getPlayersByTournament(selectedTournamentId) : []
  const matches = selectedTournamentId ? getMatchesByTournament(selectedTournamentId) : []
  const activeTournaments = state.tournaments.filter(t => t.is_active)

  const generateSchedule = async () => {
    if (!selectedTournamentId) return
    await activateTournament(selectedTournamentId)
  }

  const handleRegenerateSchedule = async () => {
    if (!selectedTournamentId) return
    
    setIsRegenerating(true)
    try {
      await regenerateSchedule(selectedTournamentId)
    } catch (error) {
      console.error('Failed to regenerate schedule:', error)
    } finally {
      setIsRegenerating(false)
    }
  }

  const getMatchesByRound = () => {
    const matchesByRound: { [key: number]: any[] } = {}
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Schedule</h2>
          <p className="text-muted-foreground">
            View tournament schedules and upcoming matches.
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tournament Schedule</h2>
        <p className="text-muted-foreground">
          View tournament schedules and upcoming matches by tournament
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
            Choose a tournament to view its schedule
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
                <span>Players: {players.length}</span>
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
            <p className="text-muted-foreground text-center">
              There are no active tournaments available. Tournament admin needs to activate a tournament first.
            </p>
          </CardContent>
        </Card>
      ) : !selectedTournamentId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a Tournament</h3>
            <p className="text-muted-foreground text-center">
              Choose an active tournament above to view its schedule
            </p>
          </CardContent>
        </Card>
      ) : !hasMatches ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              No Schedule Generated
            </CardTitle>
            <CardDescription>
              {selectedTournament?.name} schedule hasn't been generated yet.
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
                : `Activate the tournament to generate matches for ${selectedTournament?.format} format.`
              }
            </p>
            {isAdmin && players.length >= 2 && (
              <Button 
                onClick={generateSchedule} 
                disabled={players.length < 2}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Activate Tournament & Generate Schedule
              </Button>
            )}
            {!isAdmin && (
              <p className="text-sm text-amber-600">
                Only the tournament administrator can generate the schedule.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Regenerate Schedule Button */}
          {isAdmin && selectedTournament && matches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Schedule Management
                </CardTitle>
                <CardDescription>
                  Regenerate the tournament schedule (this will clear all existing matches and results)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Regenerate Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Regenerate Tournament Schedule</DialogTitle>
                      <DialogDescription asChild>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div>
                            <strong>Warning:</strong> This action will permanently delete all existing matches and match results for "{selectedTournament.name}".
                          </div>
                          <div>
                            A new schedule will be generated with the currently registered players. This action cannot be undone.
                          </div>
                          <div>
                            Are you sure you want to proceed?
                          </div>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleRegenerateSchedule}
                        disabled={isRegenerating}
                        className="gap-2"
                      >
                        {isRegenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Yes, Regenerate Schedule
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
          
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