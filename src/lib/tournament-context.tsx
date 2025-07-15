'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { supabase } from './supabase'
import { toast } from 'sonner'

interface TournamentStateRow {
  id: string
  is_active: boolean
  registration_closed: boolean
  tournament_format: string
}

interface Player {
  id: string
  name: string
  lichess_username?: string
  points?: number
  email?: string
  created_at?: string
  updated_at?: string
}

interface Match {
  id: string
  white_player_id: string
  black_player_id: string
  white_player_name: string
  black_player_name: string
  round: number
  result?: string
  scheduled_at?: string
  created_at?: string
  updated_at?: string
}

interface TournamentState {
  tournamentState: TournamentStateRow
  players: Player[]
  matches: Match[]
  isLoading: boolean
  error: string | null
}

type TournamentAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TOURNAMENT_STATE'; payload: TournamentStateRow }
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_MATCHES'; payload: Match[] }

const initialState: TournamentState = {
  tournamentState: {
    id: '1', // Default to the single row in the table
    is_active: false,
    registration_closed: false,
    tournament_format: 'round-robin',
  },
  players: [],
  matches: [],
  isLoading: true,
  error: null,
}

function tournamentReducer(state: TournamentState, action: TournamentAction): TournamentState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'SET_TOURNAMENT_STATE':
      return { ...state, tournamentState: action.payload, isLoading: false }
    case 'SET_PLAYERS':
      return { ...state, players: action.payload }
    case 'SET_MATCHES':
      return { ...state, matches: action.payload }
    default:
      return state
  }
}

interface TournamentContextType extends TournamentState {
  setTournamentFormat: (format: string) => Promise<void>
  toggleRegistration: () => Promise<void>
  toggleTournamentActive: () => Promise<void>
  refreshData: () => Promise<void>
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined)

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tournamentReducer, initialState)

  const fetchData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      // Use Promise.allSettled for parallel fetching and better performance
      const [tournamentResult, playersResult, matchesResult] = await Promise.allSettled([
        // Fetch tournament state - create if doesn't exist
        supabase.from('tournament_state').select('*').single(),
        // Fetch players
        supabase.from('players').select('*').order('name', { ascending: true }),
        // Fetch matches
        supabase.from('matches').select('*').order('round', { ascending: true })
      ])

      // Handle tournament state
      if (tournamentResult.status === 'fulfilled') {
        const { data: tournamentData, error: tournamentError } = tournamentResult.value
        if (tournamentError) {
          // Create default tournament state if it doesn't exist
          const { data: newTournamentData, error: createError } = await supabase
            .from('tournament_state')
            .insert({
              id: '1',
              is_active: false,
              registration_closed: false,
              tournament_format: 'round-robin'
            })
            .select()
            .single()

          if (createError) {
            // Use default values if we can't create the record
            dispatch({ 
              type: 'SET_TOURNAMENT_STATE', 
              payload: {
                id: '1',
                is_active: false,
                registration_closed: false,
                tournament_format: 'round-robin'
              }
            })
          } else {
            dispatch({ type: 'SET_TOURNAMENT_STATE', payload: newTournamentData })
          }
        } else if (tournamentData) {
          dispatch({ type: 'SET_TOURNAMENT_STATE', payload: tournamentData })
        }
      }

      // Handle players
      if (playersResult.status === 'fulfilled') {
        const { data: playersData, error: playersError } = playersResult.value
        if (playersError && playersError.code !== 'PGRST116') {
        } else if (playersData) {
          dispatch({ type: 'SET_PLAYERS', payload: playersData })
        }
      }

      // Handle matches
      if (matchesResult.status === 'fulfilled') {
        const { data: matchesData, error: matchesError } = matchesResult.value
        if (matchesError && matchesError.code !== 'PGRST116') {
        } else if (matchesData) {
          dispatch({ type: 'SET_MATCHES', payload: matchesData })
        }
      }

    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Unknown error',
      })
      if (err instanceof Error && !err.message.includes('API key')) {
        toast.error('Failed to load tournament data.')
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  useEffect(() => {
    fetchData()

    // Set up realtime subscriptions for live updates

    // Subscribe to tournament_state changes
    const tournamentStateChannel = supabase
      .channel('tournament-state-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tournament_state' }, 
        (event) => {
          if (event.new) {
            dispatch({ type: 'SET_TOURNAMENT_STATE', payload: event.new as TournamentStateRow })
          }
        }
      )
      .subscribe()

    // Subscribe to players changes
    const playersChannel = supabase
      .channel('tournament-players-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        () => {
          // Refetch players data to ensure consistency
          fetchPlayersData()
        }
      )
      .subscribe()

    // Subscribe to matches changes
    const matchesChannel = supabase
      .channel('tournament-matches-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          // Refetch matches data to ensure consistency
          fetchMatchesData()
        }
      )
      .subscribe()

    return () => {
      tournamentStateChannel.unsubscribe()
      playersChannel.unsubscribe()
      matchesChannel.unsubscribe()
    }
  }, [])

  // Helper function to fetch only players data
  const fetchPlayersData = async () => {
    try {
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('name', { ascending: true })

      if (playersError && playersError.code !== 'PGRST116') {
      } else if (playersData) {
        dispatch({ type: 'SET_PLAYERS', payload: playersData })
      }
    } catch {
    }
  }

  // Helper function to fetch only matches data
  const fetchMatchesData = async () => {
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('round', { ascending: true })

      if (matchesError && matchesError.code !== 'PGRST116') {
      } else if (matchesData) {
        dispatch({ type: 'SET_MATCHES', payload: matchesData })
      }
    } catch {
    }
  }

  const setTournamentFormat = async (format: string) => {
    try {
      const { data, error } = await supabase
        .from('tournament_state')
        .update({ tournament_format: format })
        .eq('id', state.tournamentState.id)
        .select()
        .single()
      
      if (error) throw error
      if (data) {
        dispatch({ type: 'SET_TOURNAMENT_STATE', payload: data })
      }
    } catch (error) {
      // Update local state if database update fails
      dispatch({ 
        type: 'SET_TOURNAMENT_STATE', 
        payload: { ...state.tournamentState, tournament_format: format }
      })
    }
  }

  const toggleRegistration = async () => {
    const newStatus = !state.tournamentState.registration_closed
    try {
      const { data, error } = await supabase
        .from('tournament_state')
        .update({ registration_closed: newStatus })
        .eq('id', state.tournamentState.id)
        .select()
        .single()
        
      if (error) throw error
      if (data) {
        dispatch({ type: 'SET_TOURNAMENT_STATE', payload: data })
      }
    } catch (error) {
      // Update local state if database update fails
      dispatch({ 
        type: 'SET_TOURNAMENT_STATE', 
        payload: { ...state.tournamentState, registration_closed: newStatus }
      })
    }
  }
  
  const toggleTournamentActive = async () => {
    const newStatus = !state.tournamentState.is_active
    try {
      const { data, error } = await supabase
        .from('tournament_state')
        .update({ is_active: newStatus })
        .eq('id', state.tournamentState.id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        dispatch({ type: 'SET_TOURNAMENT_STATE', payload: data })
      }
    } catch (error) {
      // Update local state if database update fails
      dispatch({ 
        type: 'SET_TOURNAMENT_STATE', 
        payload: { ...state.tournamentState, is_active: newStatus }
      })
    }
  }

  const refreshData = async () => {
    await fetchData()
  }
  
  const value: TournamentContextType = {
    ...state,
    setTournamentFormat,
    toggleRegistration,
    toggleTournamentActive,
    refreshData,
  }

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>
}

export function useTournament() {
  const context = useContext(TournamentContext)
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider')
  }
  return context
} 