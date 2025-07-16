-- Chess Tournament Database Migration
-- Create the tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  format VARCHAR(50) NOT NULL DEFAULT 'Swiss',
  max_players INTEGER DEFAULT 32,
  total_rounds INTEGER DEFAULT 7,
  registration_open BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Update the players table (add lichess_username if not exists)
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS lichess_username VARCHAR(255);

-- Create the tournament_registrations table
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id VARCHAR(255) REFERENCES players(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(tournament_id, player_id)
);

-- Update the matches table to add tournament_id
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON tournaments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Enable update for tournament creators" ON tournaments FOR UPDATE USING (created_by = auth.uid()::text);
CREATE POLICY "Enable delete for tournament creators" ON tournaments FOR DELETE USING (created_by = auth.uid()::text);

CREATE POLICY "Enable read access for all users" ON tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON tournament_registrations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Enable delete for player" ON tournament_registrations FOR DELETE USING (player_id = auth.uid()::text);

-- Create some sample data
INSERT INTO tournaments (name, description, format, max_players, total_rounds, created_by) 
VALUES 
  ('Monthly Championship', 'Monthly chess tournament for all skill levels', 'Swiss', 32, 7, 'admin'),
  ('Weekly Blitz', 'Fast-paced weekly tournament', 'Swiss', 16, 5, 'admin'),
  ('Beginner Cup', 'Tournament for new players', 'Round Robin', 8, 7, 'admin')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_created_at ON tournaments(created_at);
CREATE INDEX IF NOT EXISTS idx_tournaments_active ON tournaments(is_active);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_player_id ON tournament_registrations(player_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();