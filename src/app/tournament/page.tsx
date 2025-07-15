'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useTournament } from '@/lib/tournament-context'
import { isAdminUser, supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Trophy, Users, Target } from 'lucide-react'

interface Player {
  id: string
  name: string
  lichess_username?: string
}

export default function TournamentPage() {
  const { user } = useUser()
  const {
    tournamentState,
    toggleRegistration,
    toggleTournamentActive,
  } = useTournament()
  const [players, setPlayers] = useState<Player[]>([])
  const [tournamentConfig, setTournamentConfig] = useState({
    tournament_name: 'Chess Tournament',
    tournament_type: 'round-robin',
    total_rounds: 7,
    max_players: 32,
    points_for_win: 3.0,
    points_for_draw: 1.0,
    description: ''
  })

  const isAdmin = user?.primaryEmailAddress?.emailAddress
    ? isAdminUser(user.primaryEmailAddress.emailAddress)
    : false

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase.from('players').select('*')
      if (error) {
        toast.error('Failed to fetch players')
        console.error('Error fetching players:', error)
      } else {
        setPlayers(data as Player[])
      }
    }

    fetchPlayers()
  }, [])

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Access Denied</h2>
          <p className="text-muted-foreground">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    )
  }

  const getRecommendedFormat = () => {
    const playerCount = players.length
    if (playerCount < 4) {
      return { format: '', description: 'Not enough players for a tournament.' }
    }
    if (playerCount <= 8) {
      return { format: 'round-robin', description: 'Round Robin: Every player plays every other player. Perfect for small groups.' }
    }
    if (playerCount <= 16) {
      return { format: 'swiss', description: 'Swiss System: Players are paired based on performance. Ideal for medium groups.' }
    }
    if (playerCount <= 32) {
      return { format: 'league', description: 'League Format: Like IPL, players compete in groups then playoffs.' }
    }
    return { format: 'world-cup', description: 'World Cup Style: Group stage followed by knockout rounds.' }
  }

  const getTournamentTypeDescription = (type: string) => {
    switch (type) {
      case 'round-robin':
        return 'Every player plays every other player once'
      case 'swiss':
        return 'Players paired based on current standings'
      case 'knockout':
        return 'Single elimination - lose and you\'re out'
      case 'league':
        return 'IPL style - group stage + playoffs'
      case 'world-cup':
        return 'FIFA style - groups then knockout rounds'
      default:
        return 'Classic tournament format'
    }
  }

  const updateTournamentConfig = async (field: string, value: string | boolean | number) => {
    try {
      const { error } = await supabase
        .from('tournament_state')
        .update({ [field]: value })
        .eq('id', '1')
        .select()
        .single()

      if (error) throw error
      
      setTournamentConfig(prev => ({ ...prev, [field]: value }))
      toast.success('Tournament configuration updated!')
    } catch (error) {
      console.error('Error updating tournament config:', error)
      toast.error('Failed to update configuration')
    }
  }

  
  const handleToggleRegistration = () => {
    toggleRegistration()
    toast.success(`Registration is now ${tournamentState.registration_closed ? 'open' : 'closed'}.`)
  }
  
  const handleToggleActive = () => {
    toggleTournamentActive()
    toast.success(`Tournament is now ${tournamentState.is_active ? 'inactive' : 'active'}.`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tournament Management</h2>
        <p className="text-muted-foreground">
          Configure and manage tournament settings (Admin Only)
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tournament Basic Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Basic Configuration
            </CardTitle>
            <CardDescription>
              Set up the core tournament parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tournament-name">Tournament Name</Label>
              <Input
                id="tournament-name"
                value={tournamentConfig.tournament_name}
                onChange={(e) => updateTournamentConfig('tournament_name', e.target.value)}
                placeholder="Enter tournament name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tournament-type">Tournament Format</Label>
              <Select
                value={tournamentConfig.tournament_type}
                onValueChange={(value) => updateTournamentConfig('tournament_type', value)}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="round-robin">🔄 Round Robin</SelectItem>
                  <SelectItem value="swiss">🇨🇭 Swiss System</SelectItem>
                  <SelectItem value="knockout">⚔️ Knockout</SelectItem>
                  <SelectItem value="league">🏆 League (IPL Style)</SelectItem>
                  <SelectItem value="world-cup">🌍 World Cup Style</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getTournamentTypeDescription(tournamentConfig.tournament_type)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total-rounds">Total Rounds</Label>
                <Input
                  id="total-rounds"
                  type="number"
                  value={tournamentConfig.total_rounds}
                  onChange={(e) => updateTournamentConfig('total_rounds', parseInt(e.target.value))}
                  min="1"
                  max="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-players">Max Players</Label>
                <Input
                  id="max-players"
                  type="number"
                  value={tournamentConfig.max_players}
                  onChange={(e) => updateTournamentConfig('max_players', parseInt(e.target.value))}
                  min="4"
                  max="128"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tournament Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Tournament Control
            </CardTitle>
            <CardDescription>
              Manage tournament status and registration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Registration</h3>
                  <p className="text-sm text-muted-foreground">
                    Current: {tournamentState.registration_closed ? 'Closed' : 'Open'}
                  </p>
                </div>
                <Badge variant={tournamentState.registration_closed ? 'destructive' : 'default'}>
                  {tournamentState.registration_closed ? 'Closed' : 'Open'}
                </Badge>
              </div>
              <Button onClick={handleToggleRegistration} variant="outline" className="w-full">
                {tournamentState.registration_closed ? 'Open Registration' : 'Close Registration'}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Tournament Status</h3>
                  <p className="text-sm text-muted-foreground">
                    Current: {tournamentState.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <Badge variant={tournamentState.is_active ? 'default' : 'secondary'}>
                  {tournamentState.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Button 
                onClick={handleToggleActive} 
                variant="outline"
                size="lg"
                className="w-full"
              >
                {tournamentState.is_active ? 'End Tournament' : 'Start Tournament'}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 border rounded">
                <p className="text-lg font-bold text-blue-600">{players.length}</p>
                <p className="text-xs text-muted-foreground">Players</p>
              </div>
              <div className="p-2 border rounded">
                <p className="text-lg font-bold text-green-600">0</p>
                <p className="text-xs text-muted-foreground">Matches</p>
              </div>
              <div className="p-2 border rounded">
                <p className="text-lg font-bold text-purple-600">1</p>
                <p className="text-xs text-muted-foreground">Round</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smart Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Smart Recommendations
            </CardTitle>
            <CardDescription>
              AI-powered suggestions based on your setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-accent/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Recommended</Badge>
                <span className="text-sm font-medium">{getRecommendedFormat().format || 'None'}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {getRecommendedFormat().description}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Format Comparison</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Round Robin:</span>
                  <span className="text-muted-foreground">4-8 players</span>
                </div>
                <div className="flex justify-between">
                  <span>Swiss:</span>
                  <span className="text-muted-foreground">8-16 players</span>
                </div>
                <div className="flex justify-between">
                  <span>League:</span>
                  <span className="text-muted-foreground">16-32 players</span>
                </div>
                <div className="flex justify-between">
                  <span>World Cup:</span>
                  <span className="text-muted-foreground">32+ players</span>
                </div>
              </div>
            </div>

            {getRecommendedFormat().format && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => updateTournamentConfig('tournament_type', getRecommendedFormat().format)}
              >
                Apply Recommendation
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 