'use client'

import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useTournament, Tournament } from '@/lib/tournament-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Users, Trophy, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface TournamentRegistrationProps {
  tournament: Tournament
}

export function TournamentRegistration({ tournament }: TournamentRegistrationProps) {
  const { user } = useUser()
  const { 
    registerForTournament, 
    unregisterFromTournament, 
    isPlayerRegistered, 
    getPlayersByTournament,
    state 
  } = useTournament()
  
  const [loading, setLoading] = useState(false)
  
  const isRegistered = user?.id ? isPlayerRegistered(tournament.id, user.id) : false
  const registeredPlayers = getPlayersByTournament(tournament.id)
  const isRegistrationOpen = tournament.registration_open && !tournament.is_active
  const spotsRemaining = tournament.max_players - registeredPlayers.length

  const handleRegistration = async () => {
    if (!user?.id) {
      toast.error('Please sign in to register for tournaments')
      return
    }

    setLoading(true)
    try {
      if (isRegistered) {
        await unregisterFromTournament(tournament.id, user.id)
      } else {
        await registerForTournament(tournament.id, user.id)
      }
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTournamentStatus = () => {
    if (tournament.is_active) {
      return { label: 'Active', variant: 'default' as const, icon: <Trophy className="h-4 w-4" /> }
    }
    if (!tournament.registration_open) {
      return { label: 'Registration Closed', variant: 'destructive' as const, icon: <Clock className="h-4 w-4" /> }
    }
    if (registeredPlayers.length >= tournament.max_players) {
      return { label: 'Full', variant: 'destructive' as const, icon: <Users className="h-4 w-4" /> }
    }
    return { label: 'Open Registration', variant: 'secondary' as const, icon: <CheckCircle className="h-4 w-4" /> }
  }

  const status = getTournamentStatus()

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{tournament.name}</CardTitle>
            <CardDescription>
              {tournament.description || `${tournament.format} tournament with ${tournament.max_players} players`}
            </CardDescription>
          </div>
          <Badge variant={status.variant} className="gap-1">
            {status.icon}
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{registeredPlayers.length} / {tournament.max_players} players</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <span>{tournament.format} format</span>
          </div>
          {tournament.start_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Starts {new Date(tournament.start_date).toLocaleDateString()}</span>
            </div>
          )}
          {spotsRemaining > 0 && spotsRemaining <= 5 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-amber-600">{spotsRemaining} spots left</span>
            </div>
          )}
        </div>

        {/* Registration button */}
        {user && isRegistrationOpen && (
          <Button 
            onClick={handleRegistration}
            disabled={loading || (!isRegistered && registeredPlayers.length >= tournament.max_players)}
            variant={isRegistered ? "outline" : "default"}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                {isRegistered ? 'Unregistering...' : 'Registering...'}
              </>
            ) : (
              <>
                {isRegistered ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Registered - Click to unregister
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4 mr-2" />
                    Register for Tournament
                  </>
                )}
              </>
            )}
          </Button>
        )}

        {!user && (
          <Button disabled className="w-full">
            Sign in to register
          </Button>
        )}

        {!isRegistrationOpen && (
          <div className="text-sm text-muted-foreground text-center">
            {tournament.is_active ? 'Tournament is currently active' : 'Registration is closed'}
          </div>
        )}

        {/* Show registered players */}
        {registeredPlayers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Registered Players:</h4>
            <div className="flex flex-wrap gap-2">
              {registeredPlayers.slice(0, 8).map((player) => (
                <Badge key={player.id} variant="outline" className="text-xs">
                  {player.name}
                </Badge>
              ))}
              {registeredPlayers.length > 8 && (
                <Badge variant="outline" className="text-xs">
                  +{registeredPlayers.length - 8} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TournamentRegistrationSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-18" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}