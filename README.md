# Chess Tournament Management System

A modern, full-featured chess tournament management system built with Next.js 15, TypeScript, and Supabase. This application allows administrators to manage tournaments and players to participate in organized chess competitions.

## Features

### For Tournament Administrators
- **Tournament Management**: Create, configure, and manage chess tournaments
- **Player Registration**: View and manage player registrations
- **Match Scheduling**: Generate tournament schedules and manage rounds
- **Results Tracking**: Monitor match results and tournament progress
- **Tournament Formats**: Support for different tournament formats
- **Real-time Updates**: Live updates across all connected clients

### For Players
- **Easy Registration**: Simple sign-up process with Clerk authentication
- **Match Viewing**: View upcoming and completed matches
- **Result Submission**: Submit match results directly through the interface
- **Leaderboard**: Track standings and rankings
- **Profile Management**: Manage player profiles and preferences

### Technical Features
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Mode**: Toggle between themes for better user experience
- **Real-time Subscriptions**: Live updates using Supabase real-time
- **Type Safety**: Full TypeScript implementation
- **Modern UI**: Clean, modern interface built with Radix UI and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 with React 19
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form with Zod validation
- **Toast Notifications**: Sonner

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chess-tournament-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Admin Configuration
   NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
   ```

4. **Set up Supabase Database**
   
   Create the following tables in your Supabase database:

   ```sql
   -- Tournament state table
   CREATE TABLE tournament_state (
     id SERIAL PRIMARY KEY,
     tournament_name VARCHAR(255) NOT NULL DEFAULT 'Chess Tournament',
     tournament_format VARCHAR(50) NOT NULL DEFAULT 'Swiss',
     registration_closed BOOLEAN NOT NULL DEFAULT FALSE,
     is_active BOOLEAN NOT NULL DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
   );

   -- Players table
   CREATE TABLE players (
     id VARCHAR(255) PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     rating INTEGER DEFAULT 1200,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
   );

   -- Matches table
   CREATE TABLE matches (
     id SERIAL PRIMARY KEY,
     round INTEGER NOT NULL,
     white_player_id VARCHAR(255) REFERENCES players(id),
     black_player_id VARCHAR(255) REFERENCES players(id),
     white_player_name VARCHAR(255) NOT NULL,
     black_player_name VARCHAR(255) NOT NULL,
     result VARCHAR(10), -- '1-0', '0-1', '1/2-1/2'
     scheduled_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
   );

   -- Enable Row Level Security
   ALTER TABLE tournament_state ENABLE ROW LEVEL SECURITY;
   ALTER TABLE players ENABLE ROW LEVEL SECURITY;
   ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

   -- Create policies (adjust based on your security needs)
   CREATE POLICY "Enable read access for all users" ON tournament_state FOR SELECT USING (true);
   CREATE POLICY "Enable read access for all users" ON players FOR SELECT USING (true);
   CREATE POLICY "Enable read access for all users" ON matches FOR SELECT USING (true);
   ```

5. **Configure Clerk Authentication**
   - Set up your Clerk application
   - Configure sign-in/sign-up pages
   - Set the admin email in environment variables

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Dashboard page
│   ├── leaderboard/       # Tournament standings
│   ├── matches/           # Match management
│   ├── players/           # Player management
│   ├── schedule/          # Tournament schedule
│   ├── sign-in/           # Authentication pages
│   ├── sign-up/           
│   ├── tournament/        # Tournament configuration
│   └── user-profile/      # User profile management
├── components/            # Reusable UI components
│   ├── layout/           # Layout components
│   └── ui/               # Base UI components
├── lib/                  # Utility functions and configurations
│   ├── supabase.ts       # Supabase client setup
│   ├── tournament-context.tsx  # Tournament state management
│   └── utils.ts          # Utility functions
└── hooks/                # Custom React hooks
```

## Usage

### For Administrators

1. **Set up Tournament**
   - Navigate to the Tournament page
   - Configure tournament name and format
   - Open registration for players

2. **Manage Players**
   - View registered players in the Players section
   - Monitor player registrations

3. **Generate Schedule**
   - Use the Schedule page to generate tournament rounds
   - View match pairings for each round

4. **Monitor Results**
   - Track match results in the Matches section
   - View tournament progress

### For Players

1. **Register**
   - Sign up using the authentication system
   - Complete your player profile

2. **View Matches**
   - Check your upcoming matches
   - View match history

3. **Submit Results**
   - Submit match results after games
   - View tournament standings

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

This project uses:
- TypeScript for type safety
- ESLint for code linting
- Tailwind CSS for styling
- Strict mode enabled

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a pull request

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Administrator email | Yes |

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Ensure all environment variables are set
   - Check TypeScript errors with `npm run lint`

2. **Database Connection**
   - Verify Supabase credentials
   - Check Row Level Security policies

3. **Authentication Issues**
   - Verify Clerk configuration
   - Check domain settings in Clerk dashboard

### Support

For issues and questions:
1. Check the GitHub issues page
2. Review the documentation
3. Contact the development team

## License

This project is private and proprietary. All rights reserved.

## Acknowledgments

- Built with Next.js and React
- UI components from Radix UI
- Styling with Tailwind CSS
- Database powered by Supabase
- Authentication by Clerk