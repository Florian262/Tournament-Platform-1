# Arena - Esports Tournament Management Platform

A comprehensive, production-ready esports tournament platform with role-based authentication, real-time tournament management, automatic bracket generation, and modern dark-mode UI.

## Features

- **Dual User Roles**: Competitors can join tournaments, Organizers can create and manage them
- **Tournament Management**: Create, configure, and run tournaments with multiple formats
- **Bracket Generation**: Automatic single/double elimination and round robin brackets
- **Advanced Filtering**: Search tournaments by game, platform, region, and status
- **Live Updates**: Real-time participant tracking and match status
- **Responsive Design**: Beautiful dark-mode UI optimized for all screen sizes

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The database schema has already been created and includes:
- User profiles with role-based access
- Games, teams, and tournaments
- Match and bracket management
- Comprehensive Row Level Security policies

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see the platform.

### 4. Build for Production
```bash
npm run build
```

## Database Schema

### Key Tables
- **user_profiles**: Extended user data with roles (competitor/organizer/admin)
- **games**: Supported esports titles (LoL, CS2, Valorant, Dota 2, etc.)
- **teams**: Team entities for team-based tournaments
- **tournaments**: Tournament configuration and management
- **tournament_participants**: Registration tracking with seeding
- **matches**: Individual match data with results
- **match_results**: Detailed scoring and statistics

All tables are protected with Row Level Security policies.

## Project Structure

```
src/
├── components/          # React components
│   ├── AuthModal.tsx
│   ├── HomePage.tsx
│   ├── TournamentListings.tsx
│   ├── TournamentDashboard.tsx
│   ├── CreateTournament.tsx
│   └── ManageTournament.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── lib/               # Configuration
│   └── supabase.ts
├── types/             # TypeScript types
│   └── index.ts
├── utils/             # Utilities
│   └── bracketGenerator.ts
└── App.tsx            # Main application
```

## User Flows

### For Competitors
1. Sign up as a Competitor
2. Browse tournaments by game
3. Register for tournaments
4. View brackets and match schedules
5. Track tournament progress

### For Organizers
1. Sign up as an Organizer
2. Create tournaments with custom settings
3. Manage participant registrations
4. Generate brackets automatically
5. Update match results
6. Control tournament status

## Tournament Formats

### Single Elimination
- Traditional knockout bracket
- Seeded matchups
- Automatic BYE handling

### Double Elimination
- Winners and losers brackets
- Second chance for all participants
- Grand finals

### Round Robin
- Every participant plays everyone once
- Points-based ranking
- No elimination

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Dark Mode)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RLS
- **Icons**: Lucide React

## Security

- Row Level Security on all database tables
- Role-based access control (RBAC)
- JWT authentication with automatic refresh
- Secure password hashing
- Protected API routes

## Design Philosophy

- **Dark Mode First**: Deep blues and purples with vibrant accents
- **High Contrast**: Optimal readability for extended use
- **Esports Aesthetic**: Modern, competitive gaming platform design
- **Responsive**: Mobile-first approach, scales beautifully to desktop
- **Accessibility**: Clear visual hierarchy and status indicators

## Documentation

For detailed architecture, API documentation, and implementation details, see [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)

## Future Enhancements

- Real-time match updates with Supabase Realtime
- Live streaming integration (Twitch/YouTube)
- Team management dashboard
- Tournament analytics and statistics
- Discord bot integration
- Mobile app with React Native
- Payment processing for entry fees
- Tournament brackets as visual tree diagrams

## License

Demonstration project for esports tournament management.
