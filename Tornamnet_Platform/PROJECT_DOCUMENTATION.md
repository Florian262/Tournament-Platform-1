# Arena - Esports Tournament Management Platform

A comprehensive, production-ready esports tournament management platform built with modern web technologies. Features role-based authentication, real-time tournament management, bracket generation, and a sleek dark-mode UI inspired by modern esports aesthetics.

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Dark mode with blue/purple accents)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Row Level Security
- **Icons**: Lucide React

### Design Philosophy
- **Dark Mode First**: Deep blues/purples with high-contrast text and vibrant accents
- **Responsive**: Mobile-first design with seamless scaling to desktop
- **Esports Aesthetic**: Modern, high-energy design inspired by competitive gaming platforms
- **Security First**: Comprehensive RLS policies, role-based access control

---

## Database Schema

### Core Tables

#### 1. **user_profiles**
Extended user information linked to Supabase auth
- Stores username, avatar, role (competitor/organizer/admin)
- One-to-one relationship with auth.users

#### 2. **games**
Supported esports titles
- Pre-populated with: LoL, CS2, Valorant, Dota 2, Rocket League, Fortnite
- Includes platform information (PC, Console, Mobile, Cross-Platform)

#### 3. **teams**
Team entities for team-based tournaments
- Links to owner (user), game, and region
- Supports team logos and tags

#### 4. **team_members**
Junction table for team membership
- Tracks roles: captain, player, substitute

#### 5. **tournaments**
Main tournament configuration
- Status workflow: pending → registration_open → running → completed
- Supports multiple formats: single elimination, double elimination, round robin
- Tracks participants, dates, prizes, rules, and streaming

#### 6. **tournament_participants**
Registered teams/players in tournaments
- Handles both team and solo tournaments
- Tracks seeding and status (registered, checked_in, eliminated, winner)

#### 7. **matches**
Individual tournament matches
- Tracks rounds, participants, winners, and status
- Supports scheduling and streaming links

#### 8. **match_results**
Detailed match scores and statistics
- JSONB field for flexible stat tracking

### Security Model
- **RLS enabled on all tables**
- Public data viewable by authenticated users
- Users can only modify their own data
- Organizers can manage their tournaments
- Comprehensive policies prevent unauthorized access

---

## Project Structure

```
src/
├── components/
│   ├── AuthModal.tsx              # Login/signup modal with role selection
│   ├── Navbar.tsx                 # Global navigation with auth controls
│   ├── HomePage.tsx               # Discovery hub with game grid & tournament sections
│   ├── TournamentListings.tsx    # Browse page with advanced filtering
│   ├── TournamentDashboard.tsx   # Detailed tournament view with tabs
│   ├── CreateTournament.tsx      # Tournament creation form (organizers)
│   └── ManageTournament.tsx      # Tournament management (organizers)
│
├── contexts/
│   └── AuthContext.tsx            # Authentication state & methods
│
├── lib/
│   └── supabase.ts                # Supabase client configuration
│
├── types/
│   └── index.ts                   # TypeScript interfaces for all entities
│
├── utils/
│   └── bracketGenerator.ts        # Bracket generation algorithms
│
├── App.tsx                        # Main app with routing logic
├── main.tsx                       # App entry point
└── index.css                      # Global styles (Tailwind)
```

---

## Key Features

### 1. User Roles & Authentication
- **Unified Auth Modal**: Single modal for both login and signup
- **Role Selection**: Users choose between Competitor or Organizer on signup
- **Session Management**: Persistent authentication with automatic profile loading
- **Role-Based UI**: Different interfaces for competitors vs organizers

### 2. Tournament Discovery (Homepage)
- **Hero Section**: High-impact CTA with role-based actions
- **Game Grid**: Visual game selector with platform badges
- **Tournament Sections**:
  - Registration Open (green accent)
  - Live Now (red accent)
  - Past Tournaments (grey accent)
- **Horizontal Scrolling**: Optimized for browsing multiple tournaments

### 3. Tournament Listings
- **Advanced Filtering**:
  - Game title
  - Platform (PC, Console, Mobile, Cross-Platform)
  - Region (NA, EU, ASIA, OCE, SA)
  - Status (registration_open, running, completed, pending)
  - Search by name
- **Responsive Grid**: Adapts from 1 to 2 columns based on screen size
- **Real-time Participant Count**: Shows filled spots (e.g., "32/64")

### 4. Tournament Dashboard
Five-tab interface providing comprehensive tournament information:

**Overview Tab**:
- Participant count, prize pool, format at a glance
- Full description and rules
- Tournament metadata (dates, organizer, type)

**Participants Tab**:
- Grid of all registered teams/players
- Seeding numbers
- Avatars and team logos

**Brackets Tab**:
- Visual representation of tournament structure
- Round-by-round match display
- Winner indicators (trophy icons)
- Match status badges (pending, in_progress, completed)

**Schedule Tab**:
- Chronological list of scheduled matches
- Date/time for each match
- Status indicators

**Streams Tab**:
- Embedded Twitch/YouTube player
- Auto-detection of platform for proper embedding

### 5. Tournament Creation (Organizers)
Comprehensive form with:
- Basic info (name, description, game)
- Format selection (single/double elimination, round robin)
- Participant configuration (type, max count)
- Date ranges (registration + tournament dates)
- Optional fields (banner, prize pool, rules, stream URL)
- Region selection

### 6. Tournament Management (Organizers)
**Status Control**:
- Open registration
- Start tournament
- Mark as completed

**Participant Management**:
- View all registrations
- Remove participants
- Auto-assign seeds (by registration order)

**Bracket Generation**:
- One-click bracket creation
- Automatic BYE handling for non-power-of-2 participant counts
- Supports all three tournament formats

### 7. Bracket Generation Algorithms

**Single Elimination**:
- Traditional knockout format
- Seeded bracket (higher seeds vs lower seeds)
- Power-of-2 bracket size with BYE support
- Example: 16 teams → 4 rounds (8→4→2→1)

**Double Elimination**:
- Winners bracket + Losers bracket
- Second chance for eliminated teams
- Grand finals between winners bracket champion and losers bracket champion

**Round Robin**:
- Every participant plays every other participant once
- Total matches: n*(n-1)/2
- No elimination, points-based ranking

---

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- A Supabase account

### 1. Clone and Install
```bash
npm install
```

### 2. Supabase Setup
The database schema has already been applied. You need to:

1. Get your Supabase project credentials:
   - Navigate to your Supabase project settings
   - Copy the Project URL and Anon Key

2. Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
```

---

## User Flows

### Competitor Flow
1. Sign up as Competitor
2. Browse tournaments by game
3. Register for a tournament
4. View tournament details, brackets, and schedule
5. Check match results

### Organizer Flow
1. Sign up as Organizer
2. Create a new tournament
3. Configure tournament details and rules
4. Open registration
5. Monitor participant registrations
6. Assign seeds and generate bracket
7. Start tournament
8. Input match results (future feature)
9. Mark tournament as completed

---

## Design System

### Color Palette
- **Background**: Deep slate (slate-950, slate-900)
- **Accent Gradients**: Blue (blue-950, blue-600/700)
- **Status Colors**:
  - Success/Open: Green (green-500)
  - Live/Active: Red (red-500)
  - Completed: Slate (slate-500)
  - Pending: Blue (blue-500)
- **Text**:
  - Primary: White
  - Secondary: Slate-300/400
  - Tertiary: Slate-500

### Typography
- **Headings**: Bold, large sizes (2xl-7xl)
- **Body**: Slate-300 for readability
- **Accent Text**: Blue-400 for CTAs and links

### Component Patterns
- **Cards**: Slate-900/50 with blue-500/20 borders and backdrop blur
- **Buttons**: Gradient fills with shadow glow effects
- **Inputs**: Slate-800/50 backgrounds with blue focus rings
- **Badges**: Transparent backgrounds with colored borders and text
- **Hover States**: Scale, shadow, and color transitions

---

## Future Enhancements

### Phase 2 Features
- Real-time match updates using Supabase Realtime
- In-app messaging between participants
- Tournament bracket visualization as a tree diagram
- Advanced statistics and analytics
- Team management dashboard
- Tournament templates
- Email notifications
- Discord/Twitch integration
- Payment processing for entry fees

### Technical Improvements
- Server-side rendering with Next.js
- Progressive Web App support
- Enhanced mobile experience with native gestures
- Image upload and CDN integration
- Advanced search with Postgres full-text search
- Export brackets to PDF

---

## API Integration Points

### Supabase Queries
The application uses Supabase's JavaScript client for all database operations:

- **Authentication**: `supabase.auth.*`
- **Data Fetching**: `supabase.from().select()`
- **Joins**: Using foreign key relationships
- **Filtering**: `.eq()`, `.ilike()`, `.order()`
- **Realtime**: Ready for Supabase Realtime subscriptions

### Row Level Security
All queries automatically enforce RLS policies:
- Users can only see their own profile data for modification
- Tournament data is public for viewing
- Only organizers can manage their tournaments
- Bracket modifications restricted to tournament organizers

---

## Performance Considerations

### Optimizations
- **Code Splitting**: Component-based chunking with React.lazy (future)
- **Image Loading**: External image URLs (Pexels) for stock photos
- **Database Indexing**: Strategic indexes on foreign keys and frequently queried columns
- **Query Efficiency**: Selective field fetching with Supabase `.select()`

### Scalability
- **Database**: PostgreSQL handles millions of rows efficiently
- **Authentication**: Supabase Auth scales automatically
- **Static Assets**: Vite's optimized bundling for production
- **CDN Ready**: Built output can be deployed to any CDN

---

## Security Considerations

### Authentication
- Secure password hashing (Supabase)
- JWT-based session management
- Automatic token refresh

### Database
- Row Level Security on all tables
- No direct database access from client
- Supabase handles SQL injection prevention

### Frontend
- No sensitive keys in client code
- Environment variables for configuration
- XSS prevention via React's built-in escaping

---

## License

This project is a demonstration of a full-stack tournament management platform architecture.

---

## Credits

- **UI Design**: Custom design inspired by modern esports platforms
- **Icons**: Lucide React
- **Stock Photos**: Pexels
- **Database**: Supabase (PostgreSQL)
