'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { supabase } from './supabase'
import { toast } from 'sonner'

interface Tournament {
  id: string
  name: string
  description?: string
  format: string
  max_players: number
  total_rounds: number
  registration_open: boolean
  is_active: boolean
  start_date?: string
  end_date?: string
  rules?: string
  created_by: string
  created_at: string
  updated_at: string
}

interface Player {
  id: string
  name: string
  email: string
  rating: number
  lichess_username?: string
  created_at: string
}

interface TournamentRegistration {
  id: string
  tournament_id: string
  player_id: string
  registered_at: string
}

interface Match {
  id: string
  tournament_id: string
  round: number
  white_player_id: string
  black_player_id: string
  white_player_name: string
  black_player_name: string
  result?: string
  scheduled_at?: string
  created_at: string
}

interface TournamentState {
  tournaments: Tournament[]
  players: Player[]
  registrations: TournamentRegistration[]
  matches: Match[]
  isLoading: boolean
  error: string | null
}

type TournamentAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TOURNAMENTS'; payload: Tournament[] }
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_REGISTRATIONS'; payload: TournamentRegistration[] }
  | { type: 'SET_MATCHES'; payload: Match[] }
  | { type: 'ADD_TOURNAMENT'; payload: Tournament }
  | { type: 'UPDATE_TOURNAMENT'; payload: Tournament }
  | { type: 'ADD_REGISTRATION'; payload: TournamentRegistration }
  | { type: 'REMOVE_REGISTRATION'; payload: { tournament_id: string; player_id: string } }
  | { type: 'UPDATE_MATCH'; payload: Match }

const initialState: TournamentState = {
  tournaments: [],
  players: [],
  registrations: [],
  matches: [],
  isLoading: true,
  error: null,
}

function tournamentReducer(state: TournamentState, action: TournamentAction): TournamentState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_TOURNAMENTS':
      return { ...state, tournaments: action.payload }
    case 'SET_PLAYERS':
      return { ...state, players: action.payload }
    case 'SET_REGISTRATIONS':
      return { ...state, registrations: action.payload }
    case 'SET_MATCHES':
      return { ...state, matches: action.payload }
    case 'ADD_TOURNAMENT':
      return { ...state, tournaments: [...state.tournaments, action.payload] }
    case 'UPDATE_TOURNAMENT':
      return {
        ...state,
        tournaments: state.tournaments.map(t => 
          t.id === action.payload.id ? action.payload : t
        )
      }
    case 'ADD_REGISTRATION':
      return { ...state, registrations: [...state.registrations, action.payload] }
    case 'REMOVE_REGISTRATION':
      return {
        ...state,
        registrations: state.registrations.filter(r => 
          !(r.tournament_id === action.payload.tournament_id && r.player_id === action.payload.player_id)
        )
      }
    case 'UPDATE_MATCH':
      return {
        ...state,
        matches: state.matches.map(m => 
          m.id === action.payload.id ? action.payload : m
        )
      }
    default:
      return state
  }
}

interface TournamentContextValue {
  state: TournamentState
  // Tournament actions
  createTournament: (tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at'>) => Promise<Tournament | null>
  updateTournament: (id: string, updates: Partial<Tournament>) => Promise<void>
  deleteTournament: (id: string) => Promise<void>
  activateTournament: (tournamentId: string) => Promise<void>
  regenerateSchedule: (tournamentId: string) => Promise<void>
  
  // Registration actions
  registerForTournament: (tournamentId: string, playerId: string) => Promise<void>
  unregisterFromTournament: (tournamentId: string, playerId: string) => Promise<void>
  
  // Match actions
  submitMatchResult: (matchId: string, result: string) => Promise<void>
  
  // Utility functions
  getTournamentById: (id: string) => Tournament | undefined
  getPlayersByTournament: (tournamentId: string) => Player[]
  getMatchesByTournament: (tournamentId: string) => Match[]
  isPlayerRegistered: (tournamentId: string, playerId: string) => boolean
  getCurrentUserPlayer: () => Player | null
  refreshData: () => Promise<void>
  
  // Legacy support for existing components
  tournamentState: Tournament | null
  players: Player[]
  matches: Match[]
  isLoading: boolean
}

const TournamentContext = createContext<TournamentContextValue | undefined>(undefined)

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tournamentReducer, initialState)

  // Load initial data
  useEffect(() => {
    loadData()
    setupRealtimeSubscriptions()
  }, [])

  const loadData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // Load tournaments
      const { data: tournaments, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (tournamentsError) throw tournamentsError
      dispatch({ type: 'SET_TOURNAMENTS', payload: tournaments || [] })
      
      // Load players
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('name')
      
      if (playersError) throw playersError
      dispatch({ type: 'SET_PLAYERS', payload: players || [] })
      
      // Load registrations
      const { data: registrations, error: registrationsError } = await supabase
        .from('tournament_registrations')
        .select('*')
      
      if (registrationsError) throw registrationsError
      dispatch({ type: 'SET_REGISTRATIONS', payload: registrations || [] })
      
      // Load matches
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('round', { ascending: true })
      
      if (matchesError) throw matchesError
      dispatch({ type: 'SET_MATCHES', payload: matches || [] })
      
    } catch (error) {
      console.error('Error loading data:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load tournament data' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const setupRealtimeSubscriptions = () => {
    // Subscribe to tournament changes
    supabase
      .channel('tournaments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => {
        loadData()
      })
      .subscribe()

    // Subscribe to registration changes
    supabase
      .channel('tournament_registrations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_registrations' }, () => {
        loadData()
      })
      .subscribe()

    // Subscribe to match changes
    supabase
      .channel('matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        loadData()
      })
      .subscribe()
  }

  const createTournament = async (tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at'>): Promise<Tournament | null> => {
    try {
      // Remove date fields and ensure we don't send them
      const { start_date, end_date, ...cleanedTournament } = tournament
      
      console.log('Creating tournament with data:', cleanedTournament)
      
      const { data, error } = await supabase
        .from('tournaments')
        .insert([cleanedTournament])
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(error.message || error.details || 'Failed to create tournament')
      }
      
      if (!data) {
        throw new Error('No data returned from tournament creation')
      }
      
      const newTournament = data as Tournament
      dispatch({ type: 'ADD_TOURNAMENT', payload: newTournament })
      toast.success('Tournament created successfully!')
      return newTournament
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error creating tournament:', errorMessage, error)
      toast.error(`Failed to create tournament: ${errorMessage}`)
      return null
    }
  }

  const updateTournament = async (id: string, updates: Partial<Tournament>) => {
    try {
      console.log('Updating tournament with data:', { id, updates })
      
      const { data, error } = await supabase
        .from('tournaments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(error.message || error.details || 'Failed to update tournament')
      }
      
      if (!data) {
        throw new Error('No data returned from tournament update')
      }
      
      dispatch({ type: 'UPDATE_TOURNAMENT', payload: data as Tournament })
      toast.success('Tournament updated successfully!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error updating tournament:', errorMessage, error)
      toast.error(`Failed to update tournament: ${errorMessage}`)
    }
  }

  const deleteTournament = async (id: string) => {
    try {
      console.log('🗑️ Deleting tournament with id:', id)
      
      // First, delete related data in correct order to avoid foreign key constraints
      console.log('🔄 Deleting related matches...')
      const { error: matchesError } = await supabase
        .from('matches')
        .delete()
        .eq('tournament_id', id)
      
      if (matchesError) {
        console.error('Error deleting matches:', matchesError)
        throw new Error(`Failed to delete tournament matches: ${matchesError.message}`)
      }
      
      console.log('🔄 Deleting related registrations...')
      const { error: registrationsError } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('tournament_id', id)
      
      if (registrationsError) {
        console.error('Error deleting registrations:', registrationsError)
        throw new Error(`Failed to delete tournament registrations: ${registrationsError.message}`)
      }
      
      console.log('🔄 Deleting tournament...')
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(error.message || error.details || 'Failed to delete tournament')
      }
      
      console.log('✅ Tournament and related data deleted successfully')
      
      // Update local state
      dispatch({ type: 'SET_TOURNAMENTS', payload: state.tournaments.filter(t => t.id !== id) })
      dispatch({ type: 'SET_REGISTRATIONS', payload: state.registrations.filter(r => r.tournament_id !== id) })
      dispatch({ type: 'SET_MATCHES', payload: state.matches.filter(m => m.tournament_id !== id) })
      
      toast.success('Tournament deleted successfully!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error deleting tournament:', errorMessage, error)
      toast.error(`Failed to delete tournament: ${errorMessage}`)
    }
  }

  const registerForTournament = async (tournamentId: string, playerId: string) => {
    try {
      console.log('Registering for tournament:', { tournamentId, playerId })
      console.log('Current registrations before:', state.registrations.length)
      
      // Check if already registered
      const alreadyRegistered = state.registrations.some(r => r.tournament_id === tournamentId && r.player_id === playerId)
      if (alreadyRegistered) {
        console.log('Player already registered, skipping...')
        toast.error('You are already registered for this tournament')
        return
      }
      
      const { data, error } = await supabase
        .from('tournament_registrations')
        .insert([{ tournament_id: tournamentId, player_id: playerId }])
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(error.message || error.details || 'Failed to register for tournament')
      }
      
      if (!data) {
        throw new Error('No data returned from registration')
      }
      
      console.log('Registration successful, updating state:', data)
      dispatch({ type: 'ADD_REGISTRATION', payload: data as TournamentRegistration })
      console.log('Current registrations after:', state.registrations.length + 1)
      toast.success('Registered for tournament successfully!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error registering for tournament:', errorMessage, error)
      toast.error(`Failed to register for tournament: ${errorMessage}`)
    }
  }

  const unregisterFromTournament = async (tournamentId: string, playerId: string) => {
    try {
      // Check if actually registered first
      const currentRegistration = state.registrations.find(r => r.tournament_id === tournamentId && r.player_id === playerId)
      if (!currentRegistration) {
        toast.error('You are not registered for this tournament')
        return
      }
      
      const { error, count } = await supabase
        .from('tournament_registrations')
        .delete({ count: 'exact' })
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId)
      
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(error.message || error.details || 'Failed to unregister from tournament')
      }
      
      if (count === 0) {
        console.log('No rows deleted - registration may not exist in database')
        // Still remove from local state to sync with database
        dispatch({ type: 'REMOVE_REGISTRATION', payload: { tournament_id: tournamentId, player_id: playerId } })
        toast.success('Registration status updated')
        return
      }
      
      dispatch({ type: 'REMOVE_REGISTRATION', payload: { tournament_id: tournamentId, player_id: playerId } })
      toast.success('Unregistered from tournament successfully!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error unregistering from tournament:', errorMessage, error)
      toast.error(`Failed to unregister from tournament: ${errorMessage}`)
    }
  }

  const submitMatchResult = async (matchId: string, result: string) => {
    try {
      // Find the match to update
      const match = state.matches.find(m => m.id === matchId)
      if (!match) {
        throw new Error('Match not found')
      }

      // Update match result in database
      const { data, error } = await supabase
        .from('matches')
        .update({ result })
        .eq('id', matchId)
        .select()
        .single()

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(error.message || error.details || 'Failed to submit match result')
      }

      if (!data) {
        throw new Error('No data returned from match result update')
      }

      // Update local state
      dispatch({ type: 'UPDATE_MATCH', payload: data as Match })
      toast.success('Match result submitted successfully!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error submitting match result:', errorMessage, error)
      toast.error(`Failed to submit match result: ${errorMessage}`)
      throw error
    }
  }

  const generateMatches = async (tournamentId: string) => {
    try {
      const tournament = state.tournaments.find(t => t.id === tournamentId)
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      const registrations = state.registrations.filter(r => r.tournament_id === tournamentId)
      const players = state.players.filter(p => registrations.some(r => r.player_id === p.id))

      if (players.length < 2) {
        throw new Error('Need at least 2 players to generate matches')
      }

      const matches: Omit<Match, 'id' | 'created_at'>[] = []

      if (tournament.format === 'Round Robin') {
        // Multi-round Round Robin - each player plays every other player multiple times
        const n = players.length
        if (n < 2) return

        const tournamentRounds = tournament.total_rounds || 2 // Default to 2 rounds for round robin
        const totalUniquePairs = (n * (n - 1)) / 2
        
        // Generate all unique player pairs
        const allPairs: Array<{player1: any, player2: any}> = []
        for (let i = 0; i < players.length; i++) {
          for (let j = i + 1; j < players.length; j++) {
            allPairs.push({
              player1: players[i],
              player2: players[j]
            })
          }
        }

        // Track color distribution for fairness
        const colorCount = players.reduce((acc, player) => {
          acc[player.id] = { white: 0, black: 0 }
          return acc
        }, {} as Record<string, {white: number, black: number}>)

        // Generate matches for each round
        let currentRound = 1
        
        for (let cycle = 0; cycle < tournamentRounds; cycle++) {
          // For each cycle, each pair plays once
          allPairs.forEach((pair, pairIndex) => {
            const { player1, player2 } = pair
            
            // Determine color assignment
            let whitePlayer, blackPlayer
            
            // For multiple rounds, alternate colors per cycle
            if (cycle % 2 === 0) {
              // Even cycles: use color balance and alphabetical order
              const player1WhiteCount = colorCount[player1.id].white
              const player2WhiteCount = colorCount[player2.id].white
              const player1BlackCount = colorCount[player1.id].black
              const player2BlackCount = colorCount[player2.id].black
              
              if (player1WhiteCount < player2WhiteCount) {
                whitePlayer = player1
                blackPlayer = player2
              } else if (player2WhiteCount < player1WhiteCount) {
                whitePlayer = player2
                blackPlayer = player1
              } else if (player1BlackCount > player2BlackCount) {
                whitePlayer = player1
                blackPlayer = player2
              } else if (player2BlackCount > player1BlackCount) {
                whitePlayer = player2
                blackPlayer = player1
              } else {
                // Use alphabetical order for consistency
                if (player1.name.toLowerCase() < player2.name.toLowerCase()) {
                  whitePlayer = player1
                  blackPlayer = player2
                } else {
                  whitePlayer = player2
                  blackPlayer = player1
                }
              }
            } else {
              // Odd cycles: reverse colors from previous cycle to ensure fairness
              const player1WhiteCount = colorCount[player1.id].white
              const player2WhiteCount = colorCount[player2.id].white
              
              // Give white to whoever had fewer whites in previous rounds
              if (player1WhiteCount < player2WhiteCount) {
                whitePlayer = player1
                blackPlayer = player2
              } else if (player2WhiteCount < player1WhiteCount) {
                whitePlayer = player2
                blackPlayer = player1
              } else {
                // If equal, reverse alphabetical order to alternate
                if (player1.name.toLowerCase() > player2.name.toLowerCase()) {
                  whitePlayer = player1
                  blackPlayer = player2
                } else {
                  whitePlayer = player2
                  blackPlayer = player1
                }
              }
            }

            // Update color counts
            colorCount[whitePlayer.id].white++
            colorCount[blackPlayer.id].black++

            // Calculate round number based on cycle and scheduling
            const roundNumber = cycle + 1

            matches.push({
              tournament_id: tournamentId,
              round: roundNumber,
              white_player_id: whitePlayer.id,
              black_player_id: blackPlayer.id,
              white_player_name: whitePlayer.name,
              black_player_name: blackPlayer.name,
              result: undefined,
              scheduled_at: undefined
            })
          })
        }
      } else if (tournament.format === 'Double Round Robin') {
        // Double Round Robin - each player plays every other player exactly twice (once as white, once as black)
        const n = players.length
        if (n < 2) return

        // Generate all unique player pairs
        const allPairs: Array<{player1: any, player2: any}> = []
        for (let i = 0; i < players.length; i++) {
          for (let j = i + 1; j < players.length; j++) {
            allPairs.push({
              player1: players[i],
              player2: players[j]
            })
          }
        }

        // Round 1: Each pair plays once with consistent color assignment
        allPairs.forEach((pair, pairIndex) => {
          const { player1, player2 } = pair
          
          // Use alphabetical order for first round color assignment
          let whitePlayer, blackPlayer
          if (player1.name.toLowerCase() < player2.name.toLowerCase()) {
            whitePlayer = player1
            blackPlayer = player2
          } else {
            whitePlayer = player2
            blackPlayer = player1
          }

          matches.push({
            tournament_id: tournamentId,
            round: 1,
            white_player_id: whitePlayer.id,
            black_player_id: blackPlayer.id,
            white_player_name: whitePlayer.name,
            black_player_name: blackPlayer.name,
            result: undefined,
            scheduled_at: undefined
          })
        })

        // Round 2: Same pairs but with reversed colors
        allPairs.forEach((pair, pairIndex) => {
          const { player1, player2 } = pair
          
          // Reverse colors from first round
          let whitePlayer, blackPlayer
          if (player1.name.toLowerCase() < player2.name.toLowerCase()) {
            whitePlayer = player2  // Reversed
            blackPlayer = player1  // Reversed
          } else {
            whitePlayer = player1  // Reversed
            blackPlayer = player2  // Reversed
          }

          matches.push({
            tournament_id: tournamentId,
            round: 2,
            white_player_id: whitePlayer.id,
            black_player_id: blackPlayer.id,
            white_player_name: whitePlayer.name,
            black_player_name: blackPlayer.name,
            result: undefined,
            scheduled_at: undefined
          })
        })
      } else if (tournament.format === 'Swiss') {
        // Swiss: generate first round with fair color assignment
        const shuffledPlayers = [...players].sort(() => Math.random() - 0.5)
        
        // For first round, alternate colors based on seeding/alphabetical order
        const sortedPlayers = [...players].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
        
        for (let i = 0; i < sortedPlayers.length - 1; i += 2) {
          // Alternate who gets white - even indices get white in first round
          const whitePlayer = i % 4 === 0 ? sortedPlayers[i] : sortedPlayers[i + 1]
          const blackPlayer = i % 4 === 0 ? sortedPlayers[i + 1] : sortedPlayers[i]
          
          matches.push({
            tournament_id: tournamentId,
            round: 1,
            white_player_id: whitePlayer.id,
            black_player_id: blackPlayer.id,
            white_player_name: whitePlayer.name,
            black_player_name: blackPlayer.name,
            result: undefined,
            scheduled_at: undefined
          })
        }
      }

      // Insert matches into database
      if (matches.length > 0) {
        const { error } = await supabase
          .from('matches')
          .insert(matches)

        if (error) {
          console.error('Error inserting matches:', error)
          throw error
        }

        // Refresh matches data
        const { data: newMatches, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .eq('tournament_id', tournamentId)
          .order('round', { ascending: true })

        if (matchesError) throw matchesError
        
        // Update state with new matches
        const updatedMatches = state.matches.filter(m => m.tournament_id !== tournamentId).concat(newMatches || [])
        dispatch({ type: 'SET_MATCHES', payload: updatedMatches })

        toast.success(`Generated ${matches.length} matches for ${tournament.format} tournament!`)
      }
    } catch (error) {
      console.error('Error generating matches:', error)
      toast.error(`Failed to generate matches: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  const activateTournament = async (tournamentId: string) => {
    try {
      const tournament = state.tournaments.find(t => t.id === tournamentId)
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      if (tournament.is_active) {
        // Deactivate tournament
        await updateTournament(tournamentId, { is_active: false })
      } else {
        // Activate tournament and generate matches
        await generateMatches(tournamentId)
        await updateTournament(tournamentId, { is_active: true })
      }
    } catch (error) {
      // Don't show additional error toast since generateMatches already shows one
      console.error('Error activating tournament:', error)
    }
  }

  const regenerateSchedule = async (tournamentId: string) => {
    try {
      const tournament = state.tournaments.find(t => t.id === tournamentId)
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      console.log(`🔄 Starting regeneration for tournament ${tournamentId}`)

      // First, check how many matches exist for this tournament
      const { data: existingMatches, error: countError } = await supabase
        .from('matches')
        .select('id, tournament_id, round, white_player_name, black_player_name')
        .eq('tournament_id', tournamentId)

      if (countError) {
        console.error('❌ Error checking existing matches:', countError)
        throw new Error(`Failed to check existing matches: ${countError.message}`)
      }

      const existingCount = existingMatches?.length || 0
      console.log(`📊 Found ${existingCount} existing matches to delete`)

      if (existingCount > 0) {
        // Show some sample matches that will be deleted
        console.log('🔍 Sample matches to be deleted:')
        existingMatches.slice(0, 3).forEach((match, index) => {
          console.log(`  ${index + 1}. Round ${match.round}: ${match.white_player_name} vs ${match.black_player_name}`)
        })

        // Delete all existing matches for this tournament
        const { data: deleteData, error: deleteError } = await supabase
          .from('matches')
          .delete()
          .eq('tournament_id', tournamentId)
          .select('id')

        if (deleteError) {
          console.error('❌ Error deleting existing matches:', deleteError)
          console.error('❌ Error details:', {
            message: deleteError.message,
            code: deleteError.code,
            details: deleteError.details,
            hint: deleteError.hint
          })
          
          // Special handling for RLS policy errors
          if (deleteError.code === '42501' || deleteError.message.includes('permission denied')) {
            throw new Error(`Permission denied: Cannot delete matches. This is likely due to Row Level Security (RLS) policies. Please run the SQL script provided to fix the database permissions.`)
          }
          
          throw new Error(`Failed to clear existing matches: ${deleteError.message}. Error code: ${deleteError.code}. This might be a permissions issue - check your database RLS policies.`)
        }

        const deletedCount = deleteData?.length || 0
        console.log(`✅ Successfully deleted ${deletedCount} existing matches for tournament ${tournamentId}`)

        // Verify deletion worked
        if (deletedCount !== existingCount) {
          console.warn(`⚠️  Warning: Expected to delete ${existingCount} matches but only deleted ${deletedCount}`)
        }

        // Remove matches from local state
        const updatedMatches = state.matches.filter(m => m.tournament_id !== tournamentId)
        dispatch({ type: 'SET_MATCHES', payload: updatedMatches })
      } else {
        console.log('ℹ️  No existing matches to delete')
      }

      // Generate new matches
      console.log('🔨 Generating new matches...')
      await generateMatches(tournamentId)
      
      toast.success(`Schedule regenerated successfully! ${existingCount > 0 ? `Deleted ${existingCount} old matches and ` : ''}Generated new matches.`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('❌ Error regenerating schedule:', errorMessage)
      
      // Enhanced error reporting
      if (error instanceof Error) {
        console.error('❌ Error stack:', error.stack)
      }
      
      toast.error(`Failed to regenerate schedule: ${errorMessage}`)
      throw error
    }
  }

  // Utility functions
  const getTournamentById = (id: string) => {
    return state.tournaments.find(t => t.id === id)
  }

  const getPlayersByTournament = (tournamentId: string) => {
    const registrations = state.registrations.filter(r => r.tournament_id === tournamentId)
    return state.players.filter(p => registrations.some(r => r.player_id === p.id))
  }

  const getMatchesByTournament = (tournamentId: string) => {
    return state.matches.filter(m => m.tournament_id === tournamentId)
  }

  const isPlayerRegistered = (tournamentId: string, playerId: string) => {
    return state.registrations.some(r => r.tournament_id === tournamentId && r.player_id === playerId)
  }

  // Helper function to get current user's player record
  // This needs to be implemented with proper user context in components
  const getCurrentUserPlayer = () => {
    // This is a placeholder - actual implementation should use Clerk user context
    return null
  }

  // Legacy support - use the first active tournament or most recent tournament
  const activeTournament = state.tournaments.find(t => t.is_active) || state.tournaments[0] || null
  const legacyPlayers = activeTournament ? getPlayersByTournament(activeTournament.id) : []
  const legacyMatches = activeTournament ? getMatchesByTournament(activeTournament.id) : []

  const value: TournamentContextValue = {
    state,
    createTournament,
    updateTournament,
    deleteTournament,
    activateTournament,
    regenerateSchedule,
    registerForTournament,
    unregisterFromTournament,
    submitMatchResult,
    getTournamentById,
    getPlayersByTournament,
    getMatchesByTournament,
    isPlayerRegistered,
    getCurrentUserPlayer,
    refreshData: loadData,
    // Legacy support
    tournamentState: activeTournament,
    players: legacyPlayers,
    matches: legacyMatches,
    isLoading: state.isLoading,
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

export type { Tournament, Player, TournamentRegistration, Match }