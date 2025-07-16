'use client'

import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useTournament } from '@/lib/tournament-context'
import { isAdminUser } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Trophy, Users, Target, Plus, Edit, Trash2, Play, UserCheck, UserX } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function TournamentPage() {
  const { user } = useUser()
  const { state, createTournament, updateTournament, deleteTournament, activateTournament, isLoading } = useTournament()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTournament, setEditingTournament] = useState<string | null>(null)
  
  const isAdmin = user?.primaryEmailAddress?.emailAddress
    ? isAdminUser(user.primaryEmailAddress.emailAddress)
    : false

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: 'Swiss',
    max_players: 32,
    total_rounds: 7,
    registration_open: true,
    is_active: false,
    rules: '',
  })

  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    format: 'Swiss',
    max_players: 32,
    total_rounds: 7,
    registration_open: true,
    is_active: false,
    rules: '',
  })

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tournament Management</h2>
          <p className="text-muted-foreground">
            Create and manage tournaments
          </p>
        </div>
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
      </div>
    )
  }

  const handleCreateTournament = async () => {
    if (!formData.name.trim()) {
      toast.error('Tournament name is required')
      return
    }

    const tournament = await createTournament({
      ...formData,
      created_by: user?.id || '',
    })

    if (tournament) {
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        format: 'Swiss',
        max_players: 32,
        total_rounds: 7,
        registration_open: true,
        is_active: false,
        rules: '',
      })
    }
  }

  const handleUpdateTournament = async (tournamentId: string, updates: any) => {
    await updateTournament(tournamentId, updates)
  }

  const handleDeleteTournament = async (tournamentId: string) => {
    if (window.confirm('Are you sure you want to delete this tournament? This cannot be undone.')) {
      await deleteTournament(tournamentId)
    }
  }

  const handleEditTournament = (tournament: any) => {
    setEditFormData({
      name: tournament.name,
      description: tournament.description || '',
      format: tournament.format,
      max_players: tournament.max_players,
      total_rounds: tournament.total_rounds,
      registration_open: tournament.registration_open,
      is_active: tournament.is_active,
      rules: tournament.rules || '',
    })
    setEditingTournament(tournament.id)
  }

  const handleSaveEdit = async () => {
    if (!editingTournament) return
    
    await updateTournament(editingTournament, editFormData)
    setEditingTournament(null)
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
          <h2 className="text-3xl font-bold tracking-tight">Tournament Management</h2>
          <p className="text-muted-foreground">
            Create and manage tournaments
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Tournament
        </Button>
      </div>

      {/* Create Tournament Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Tournament</CardTitle>
            <CardDescription>
              Set up a new chess tournament with custom settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Monthly Chess Championship"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={formData.format} onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Round Robin">Round Robin</SelectItem>
                    <SelectItem value="Double Round Robin">Double Round Robin</SelectItem>
                    <SelectItem value="Swiss">Swiss System</SelectItem>
                    <SelectItem value="Knockout">Knockout</SelectItem>
                    <SelectItem value="League">League</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your tournament..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rules">Tournament Rules</Label>
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                placeholder="Enter tournament rules and special conditions..."
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_players">Max Players</Label>
                <Input
                  id="max_players"
                  type="number"
                  value={formData.max_players || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_players: parseInt(e.target.value) || 0 }))}
                  min="4"
                  max="128"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_rounds">Total Rounds</Label>
                <Input
                  id="total_rounds"
                  type="number"
                  value={formData.total_rounds || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_rounds: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="20"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTournament}>
                Create Tournament
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Tournament Dialog */}
      <Dialog open={editingTournament !== null} onOpenChange={() => setEditingTournament(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Tournament</DialogTitle>
            <DialogDescription>
              Update tournament settings and configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Tournament Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Monthly Chess Championship"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-format">Format</Label>
                <Select value={editFormData.format} onValueChange={(value) => setEditFormData(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Round Robin">Round Robin</SelectItem>
                    <SelectItem value="Double Round Robin">Double Round Robin</SelectItem>
                    <SelectItem value="Swiss">Swiss System</SelectItem>
                    <SelectItem value="Knockout">Knockout</SelectItem>
                    <SelectItem value="League">League</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your tournament..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rules">Tournament Rules</Label>
              <Textarea
                id="edit-rules"
                value={editFormData.rules}
                onChange={(e) => setEditFormData(prev => ({ ...prev, rules: e.target.value }))}
                placeholder="Enter tournament rules and special conditions..."
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-max_players">Max Players</Label>
                <Input
                  id="edit-max_players"
                  type="number"
                  value={editFormData.max_players || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, max_players: parseInt(e.target.value) || 0 }))}
                  min="4"
                  max="128"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-total_rounds">Total Rounds</Label>
                <Input
                  id="edit-total_rounds"
                  type="number"
                  value={editFormData.total_rounds || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, total_rounds: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="20"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTournament(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tournament List */}
      <div className="space-y-4">
        {state.tournaments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tournaments yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first tournament to get started
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Tournament
              </Button>
            </CardContent>
          </Card>
        ) : (
          state.tournaments.map((tournament) => {
            const status = getTournamentStatus(tournament)
            const playerCount = state.registrations.filter(r => r.tournament_id === tournament.id).length
            
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
                      </CardTitle>
                      <CardDescription>
                        {tournament.description || `${tournament.format} tournament`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTournament(tournament)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTournament(tournament.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
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
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateTournament(tournament.id, { 
                        registration_open: !tournament.registration_open 
                      })}
                    >
                      {tournament.registration_open ? 'Close Registration' : 'Open Registration'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => activateTournament(tournament.id)}
                    >
                      {tournament.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}