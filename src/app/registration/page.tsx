'use client'

import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useTournament } from '@/lib/tournament-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Trophy, Users, Target, UserPlus, UserMinus, Play, UserCheck, UserX } from 'lucide-react'

export default function RegistrationPage() {
  const { user } = useUser()
  const { state, registerForTournament, unregisterFromTournament, isPlayerRegistered, refreshData, isLoading } = useTournament()
  const [showPlayerDialog, setShowPlayerDialog] = useState(false)
  const [pendingTournamentId, setPendingTournamentId] = useState<string>('')
  const [playerForm, setPlayerForm] = useState({
    name: '',
    lichess_username: ''
  })
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)

  // Find the current user's player record
  const getCurrentUserPlayer = () => {
    if (!user?.id) return null
    
    // Try to find player by Clerk user ID first
    let player = state.players.find(p => p.id === user.id)
    
    // If not found, try to find by email
    if (!player && user.primaryEmailAddress?.emailAddress) {
      player = state.players.find(p => p.email === user.primaryEmailAddress?.emailAddress)
    }
    
    return player
  }

  // Check if lichess username is already taken
  const checkUsernameUniqueness = async (username: string) => {
    if (!username.trim()) {
      setUsernameError('')
      return true
    }

    setIsCheckingUsername(true)
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id')
        .eq('lichess_username', username.trim())
        .maybeSingle()

      if (error) {
        console.error('Error checking username:', error)
        setUsernameError('Error checking username availability')
        return false
      }

      if (data) {
        setUsernameError('This Lichess username is already taken')
        return false
      } else {
        setUsernameError('')
        return true
      }
    } catch (error) {
      console.error('Failed to check username:', error)
      setUsernameError('Error checking username availability')
      return false
    } finally {
      setIsCheckingUsername(false)
    }
  }

  // Debounced username check
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (playerForm.lichess_username) {
        checkUsernameUniqueness(playerForm.lichess_username)
      } else {
        setUsernameError('')
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [playerForm.lichess_username])

  // Create a new player record for the current user
  const createPlayerRecord = async (name: string, lichessUsername: string) => {
    if (!user?.id || !name.trim()) return null

    try {
      console.log('Creating player with:', { 
        id: user.id, 
        name: name.trim(), 
        email: user.primaryEmailAddress?.emailAddress,
        lichess_username: lichessUsername.trim() || null
      })

      const { data, error } = await supabase
        .from('players')
        .insert([{
          id: user.id,
          name: name.trim(),
          email: user.primaryEmailAddress?.emailAddress || null,
          lichess_username: lichessUsername.trim() || null
        }])
        .select()
        .single()

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(error.message || error.details || 'Failed to create player')
      }

      if (!data) {
        throw new Error('No data returned from player creation')
      }

      // Refresh data to include the new player
      await refreshData()
      
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Failed to create player record:', errorMessage, error)
      throw error
    }
  }

  const handleRegister = async (tournamentId: string) => {
    let currentPlayer = getCurrentUserPlayer()
    
    // If player doesn't exist, show dialog to create profile
    if (!currentPlayer) {
      console.log('Player not found, showing registration dialog...')
      setPendingTournamentId(tournamentId)
      setPlayerForm({
        name: user?.fullName || '',
        lichess_username: ''
      })
      setShowPlayerDialog(true)
      return
    }

    // Player exists, proceed with registration
    try {
      await registerForTournament(tournamentId, currentPlayer.id)
      // Refresh data to ensure UI is in sync
      await refreshData()
    } catch (error) {
      console.error('Registration error:', error)
    }
  }

  const handleCreatePlayer = async () => {
    if (!playerForm.name.trim()) {
      toast.error('Please enter your name')
      return
    }

    // Check username uniqueness if provided
    if (playerForm.lichess_username) {
      const isUnique = await checkUsernameUniqueness(playerForm.lichess_username)
      if (!isUnique) {
        toast.error('Please choose a different Lichess username')
        return
      }
    }

    setIsCreatingPlayer(true)
    try {
      console.log('Creating player with form data:', playerForm)
      const newPlayer = await createPlayerRecord(playerForm.name, playerForm.lichess_username)
      
      if (newPlayer) {
        toast.success('Welcome! Your player profile has been created.')
        setShowPlayerDialog(false)
        
        // Now register for the tournament
        if (pendingTournamentId) {
          await registerForTournament(pendingTournamentId, newPlayer.id)
          await refreshData()
        }
        
        // Reset form
        setPlayerForm({ name: '', lichess_username: '' })
        setPendingTournamentId('')
        setUsernameError('')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to create player profile: ${errorMessage}`)
    } finally {
      setIsCreatingPlayer(false)
    }
  }

  const handleUnregister = async (tournamentId: string) => {
    const currentPlayer = getCurrentUserPlayer()
    if (!currentPlayer) {
      toast.error('Player profile not found. Please contact admin.')
      return
    }

    try {
      await unregisterFromTournament(tournamentId, currentPlayer.id)
      // Refresh data to ensure UI is in sync
      await refreshData()
    } catch (error) {
      console.error('Unregistration error:', error)
    }
  }

  const getTournamentStatus = (tournament: any) => {
    if (tournament.is_active) {
      return { label: 'Active', variant: 'default' as const, icon: <Play className="h-4 w-4" /> }
    }
    if (!tournament.registration_open) {
      return { label: 'Registration Closed', variant: 'destructive' as const, icon: <UserX className="h-4 w-4" /> }
    }
    return { label: 'Open Registration', variant: 'secondary' as const, icon: <UserCheck className="h-4 w-4" /> }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tournament Registration</h2>
          <p className="text-muted-foreground">
            Register for upcoming tournaments and manage your participation
          </p>
        </div>
        <Button variant="outline" onClick={refreshData} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {state.tournaments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tournaments available</h3>
                <p className="text-muted-foreground text-center">
                  Check back later for upcoming tournaments
                </p>
              </CardContent>
            </Card>
          ) : (
            state.tournaments.map((tournament) => {
            const status = getTournamentStatus(tournament)
            const playerCount = state.registrations.filter(r => r.tournament_id === tournament.id).length
            const currentPlayer = getCurrentUserPlayer()
            const isRegistered = currentPlayer ? isPlayerRegistered(tournament.id, currentPlayer.id) : false
            const canRegister = tournament.registration_open && !tournament.is_active && playerCount < tournament.max_players
            
            return (
              <Card key={tournament.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {tournament.name}
                        <Badge variant={status.variant} className="gap-1">
                          {status.icon}
                          {status.label}
                        </Badge>
                        {isRegistered && (
                          <Badge variant="outline" className="gap-1">
                            <UserCheck className="h-3 w-3" />
                            Registered
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {tournament.description || `${tournament.format} tournament`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{playerCount} / {tournament.max_players}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <span>{tournament.format}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{tournament.total_rounds} rounds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        Created {new Date(tournament.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isRegistered ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnregister(tournament.id)}
                        disabled={tournament.is_active}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Unregister
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRegister(tournament.id)}
                        disabled={!canRegister || !user?.id}
                        className="border border-primary/20"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Register
                      </Button>
                    )}
                    
                    {!canRegister && !isRegistered && (
                      <span className="text-sm text-muted-foreground">
                        {!tournament.registration_open && 'Registration closed'}
                        {tournament.is_active && 'Tournament is active'}
                        {playerCount >= tournament.max_players && 'Tournament is full'}
                        {!user?.id && 'Please sign in to register'}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
      )}

      {/* Player Registration Dialog */}
      <Dialog open={showPlayerDialog} onOpenChange={setShowPlayerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Your Player Profile</DialogTitle>
            <DialogDescription>
              To register for tournaments, we need to create your player profile first.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="player-name">Your Name *</Label>
              <Input
                id="player-name"
                placeholder="Enter your full name"
                value={playerForm.name}
                onChange={(e) => setPlayerForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lichess-username">Lichess Username (Optional)</Label>
              <Input
                id="lichess-username"
                placeholder="Your Lichess username"
                value={playerForm.lichess_username}
                onChange={(e) => setPlayerForm(prev => ({ ...prev, lichess_username: e.target.value }))}
                className={usernameError ? 'border-red-500' : ''}
              />
              {isCheckingUsername && (
                <p className="text-xs text-blue-600">
                  Checking username availability...
                </p>
              )}
              {usernameError && (
                <p className="text-xs text-red-600">
                  {usernameError}
                </p>
              )}
              {!usernameError && !isCheckingUsername && playerForm.lichess_username && (
                <p className="text-xs text-green-600">
                  ✓ Username available
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                This will be used to link to your Lichess profile
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowPlayerDialog(false)}
              disabled={isCreatingPlayer}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePlayer}
              disabled={isCreatingPlayer || !playerForm.name.trim() || usernameError !== ''}
            >
              {isCreatingPlayer ? 'Creating...' : 'Create Profile & Register'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}