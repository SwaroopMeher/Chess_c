'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, unknown>
  old: Record<string, unknown>
  table: string
}

type UseRealtimeProps = {
  table: string
  filter?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  onUpdate?: (payload: RealtimePayload) => void
}

export function useRealtime({ table, filter, event = '*', onUpdate }: UseRealtimeProps) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Memoize onUpdate to prevent unnecessary re-subscriptions
  const memoizedOnUpdate = useCallback((payload: RealtimePayload) => {
    onUpdate?.(payload)
  }, [onUpdate])

  useEffect(() => {
    let channelName = `realtime:${table}`
    if (filter) {
      channelName += `:${filter}`
    }

    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as never,
        {
          event,
          schema: 'public',
          table,
          ...(filter && { filter }),
        } as never,
        memoizedOnUpdate
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    setChannel(realtimeChannel)

    return () => {
      realtimeChannel.unsubscribe()
    }
  }, [table, filter, event, memoizedOnUpdate])

  return { channel, isConnected }
}

// Specific hooks for tournament data
export function useTournamentRealtime(tournamentId: string | null) {
  const [updates, setUpdates] = useState<RealtimePayload[]>([])

  useRealtime({
    table: 'matches',
    filter: tournamentId ? `tournament_id=eq.${tournamentId}` : undefined,
    onUpdate: (payload) => {
      setUpdates(prev => [...prev, payload])
    }
  })

  useRealtime({
    table: 'players',
    filter: tournamentId ? `tournament_id=eq.${tournamentId}` : undefined,
    onUpdate: (payload) => {
      setUpdates(prev => [...prev, payload])
    }
  })

  return { updates }
}

export function useMatchUpdates(onMatchUpdate: (match: Database['public']['Tables']['matches']['Row']) => void) {
  useRealtime({
    table: 'matches',
    event: 'UPDATE',
    onUpdate: (payload) => {
      if (payload.new) {
        onMatchUpdate(payload.new as Database['public']['Tables']['matches']['Row'])
      }
    }
  })
}

export function usePlayerUpdates(onPlayerUpdate: (player: Database['public']['Tables']['players']['Row']) => void) {
  useRealtime({
    table: 'players',
    event: '*',
    onUpdate: (payload) => {
      if (payload.new) {
        onPlayerUpdate(payload.new as Database['public']['Tables']['players']['Row'])
      }
    }
  })
} 