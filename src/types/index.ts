export type UserRole = 'competitor' | 'organizer' | 'admin';

export type TournamentStatus =
  | 'pending'
  | 'registration_open'
  | 'running'
  | 'completed'
  | 'cancelled';

export type TournamentFormat =
  | 'single_elimination'
  | 'double_elimination'
  | 'round_robin';

export type ParticipantType = 'team' | 'solo';

export type ParticipantStatus =
  | 'registered'
  | 'checked_in'
  | 'eliminated'
  | 'winner';

export type MatchStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'disputed';

export type Platform = 'PC' | 'Console' | 'Mobile' | 'Cross-Platform';

export type TeamRole = 'captain' | 'player' | 'substitute';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  region: string | null;
  roles?: string[];
  created_at: string;
  // optional admin fields
  is_banned?: boolean;
  banned_at?: string | null;
  ban_reason?: string | null;
}

export interface Game {
  id: string;
  name: string;
  short_name: string;
  icon_url: string | null;
  banner_url: string | null;
  platform: Platform;
  active: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  logo_url: string | null;
  owner_id: string;
  game_id: string;
  region: string | null;
  created_at: string;
  owner?: UserProfile;
  game?: Game;
  // optional extended fields used by UI
  description?: string | null;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  user?: UserProfile;
}

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  game_id: string;
  organizer_id: string;
  banner_url: string | null;
  status: TournamentStatus;
  format: TournamentFormat;
  max_participants: number;
  current_participants: number;
  participant_type: ParticipantType;
  region: string | null;
  prize_pool: string | null;
  rules: string | null;
  stream_url: string | null;
  registration_start: string | null;
  registration_end: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  game?: Game;
  organizer?: UserProfile;
  // optional admin/ui fields
  checkin_window_minutes?: number;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  team_id: string | null;
  user_id: string | null;
  seed: number | null;
  status: ParticipantStatus;
  registered_at: string;
  team?: Team;
  user?: UserProfile;
}

export interface TeamStatistics {
  team_id: string;
  total_tournaments: number;
  total_wins: number;
  win_rate: number; // 0..1
  total_prizes: number;
}

export interface PlayerStatistics {
  user_id: string;
  total_tournaments: number;
  total_wins: number;
  win_rate: number;
  total_prizes: number;
}

export interface CheckIn {
  id: string;
  tournament_id: string;
  participant_id: string;
  checked_in_by: string;
  checked_in_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor_id?: string | null;
  subject_id?: string | null;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
  created_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  bracket_position: string | null;
  participant1_id: string | null;
  participant2_id: string | null;
  winner_id: string | null;
  status: MatchStatus;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  stream_url: string | null;
  created_at: string;
  end_time?: string | null; // Virtual field for scheduling
  participant1?: TournamentParticipant;
  participant2?: TournamentParticipant;
  winner?: TournamentParticipant;
  match_results?: MatchResult[];
}

export interface MatchResult {
  id: string;
  match_id: string;
  participant_id: string;
  score: number;
  stats: Record<string, unknown>;
  submitted_by: string;
  submitted_at: string;
}

export interface BracketNode {
  match: Match;
  participant1?: TournamentParticipant;
  participant2?: TournamentParticipant;
  nextMatch?: string;
}

export type NotificationType = 'invite' | 'match_update' | 'tournament_update' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export type ScoutingPostType = 'player_looking' | 'team_vacancy';
export type ScoutingPostStatus = 'active' | 'fulfilled' | 'expired';

export interface ProScoutingPost {
  id: string;
  type: ScoutingPostType;
  user_id: string;
  team_id: string | null;
  game_id: string;
  roles: string[];
  description: string | null;
  status: ScoutingPostStatus;
  created_at: string;
  user?: UserProfile;
  team?: Team;
  game?: Game;
}
