'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const playerFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  lichess_username: z.string().optional(),
})

type PlayerFormValues = z.infer<typeof playerFormSchema>

interface Player {
  id: string
  name: string
  lichess_username?: string
}

export default function PlayersPage() {
  const { user } = useUser()
  const [players, setPlayers] = useState<Player[]>([])
  const [isRegistered, setIsRegistered] = useState(false)

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: user?.firstName || user?.username || '',
      lichess_username: '',
    },
    mode: 'onChange',
  })

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase.from('players').select('*')
      if (error) {
        toast.error('Failed to fetch players')
      } else {
        setPlayers(data as Player[])
      }
    }

    fetchPlayers()

    // Set up realtime subscription for immediate updates
    const subscription = supabase
      .channel('players-page-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'players' }, 
        () => {
          fetchPlayers() // Refetch to ensure consistency
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (user && players.length > 0) {
      setIsRegistered(players.some((p) => p.id === user.id))
    }
  }, [user, players])
  
  async function onSubmit(data: PlayerFormValues) {
    if (!user) {
      toast.error('You must be signed in to register.')
      return
    }

    const { error } = await supabase.from('players').insert([
      {
        id: user.id,
        name: data.name,
        lichess_username: data.lichess_username,
      },
    ])

    if (error) {
      toast.error('Registration failed: ' + error.message)
    } else {
      toast.success('You have successfully registered for the tournament!')
      setPlayers([...players, { id: user.id, ...data }])
      setIsRegistered(true)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Players</h2>
        <p className="text-muted-foreground">
          Register for the tournament and see who else is playing.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tournament Registration</CardTitle>
            <CardDescription>
              {isRegistered
                ? 'You are already registered for the tournament.'
                : 'Register here to participate in the tournament.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isRegistered && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your display name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lichess_username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lichess.org Username (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., MagnusCarlsen" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? 'Registering...' : 'Register'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registered Players</CardTitle>
            <CardDescription>
              A total of {players.length} players have registered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {players.map((player) => (
                <li key={player.id} className="flex items-center justify-between">
                  <span>{player.name}</span>
                  {player.lichess_username && (
                    <a
                      href={`https://lichess.org/@/${player.lichess_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      @{player.lichess_username}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 