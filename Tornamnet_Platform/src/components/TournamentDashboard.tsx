import { useEffect, useState } from 'react';
import {
  Trophy, Users, Calendar, Tv, Info, ArrowLeft,
  MapPin, Gamepad2, User, Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatInUserTZ, relativeTimeFromNow } from '../utils/time';
import { Tournament, TournamentParticipant, Match } from '../types';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import requireAuth from '../utils/actionGate';
import toast from 'react-hot-toast';
import generateSingleElimination from '../utils/bracketGenerator';
import MatchCard from './MatchCard';
import ScheduleTab from './tournament/ScheduleTab';
import Avatar from './Avatar';

interface TournamentDashboardProps {
  tournamentId: string;
  onNavigate: (page: string, data?: unknown) => void;
}

type TabType = 'overview' | 'participants' | 'brackets' | 'schedule' | 'streams';

export default function TournamentDashboard({ tournamentId, onNavigate }: TournamentDashboardProps) {
  const { user, profile } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    setLoading(true);

    const { data: tournamentData } = await supabase
      .from('tournaments')
      .select('*, game:games(*), organizer:user_profiles(*)')
      .eq('id', tournamentId)
      .maybeSingle();

    if (tournamentData) {
      setTournament(tournamentData);
    }

    const { data: participantsData } = await supabase
      .from('tournament_participants')
      .select('*, team:teams(*, game:games(*)), user:user_profiles(*)')
      .eq('tournament_id', tournamentId)
      .order('seed', { ascending: true, nullsFirst: false });

    if (participantsData) {
      setParticipants(participantsData);

      if (user) {
        const userParticipant = participantsData.find(p => p.user_id === user.id);
        setIsRegistered(!!userParticipant);
      }
    }

    const { data: matchesData } = await supabase
      .from('matches')
      .select('*, participant1:tournament_participants(*), participant2:tournament_participants(*)')
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true });

    if (matchesData) {
      setMatches(matchesData);
    }

    setLoading(false);
  };

  const handleRegister = async () => {
    console.log('Register button clicked!');
    // Gate action: if unauthenticated, show auth modal; otherwise proceed
    if (!user) console.log('User not found, opening auth modal');
    requireAuth(user, () => {
      console.log('Opening auth modal for registration');
      setShowAuthModal(true);
    }, async () => {
      console.log('Register action running');
      if (!tournament) {
        console.log('Tournament not available');
        return;
      }
    // enforce max participants by checking latest count from DB to reduce race conditions
    try {
      const { count, error: countError } = await supabase
        .from('tournament_participants')
        .select('id', { count: 'exact' })
        .eq('tournament_id', tournament.id);

      if (countError) {
        console.error('Error fetching participant count:', countError);
        toast.error('Failed to check registration capacity');
      } else if (typeof count === 'number' && count >= tournament.max_participants) {
        toast.error('Registration failed: tournament is full');
        return;
      }
    } catch (err: any) {
      console.error('Error checking participant count:', err);
      toast.error(err?.message || 'Error checking registration capacity');
    }

      setRegistering(true);

      // capture original count to use for server update and possible revert
      const originalCount = tournament.current_participants;

      try {
        // optimistic UI update
        setTournament(prev => prev ? { ...prev, current_participants: prev.current_participants + 1 } : prev);

        console.log('Attempting to insert participant for tournament', tournament.id, 'user', user!.id);

        const { data: insertData, error: insertError } = await supabase
          .from('tournament_participants')
          .insert({
            tournament_id: tournament.id,
            user_id: user!.id,
            status: 'registered',
          });

        if (insertError) {
          // If duplicate key, treat as already-registered; otherwise revert optimistic update and surface error
          if ((insertError as any).code === '23505' || (insertError as any).message?.toLowerCase().includes('duplicate')) {
            console.warn('User already registered (duplicate).');
            toast.success('You are already registered');
            setIsRegistered(true);
          } else {
            // revert optimistic update
            setTournament(prev => prev ? { ...prev, current_participants: originalCount } : prev);
            throw insertError;
          }
        } else {
          setIsRegistered(true);
        }

        // persist count server-side (attempt, but don't block UI if it fails)
        try {
          await supabase
            .from('tournaments')
            .update({ current_participants: originalCount + 1 })
            .eq('id', tournament.id);
        } catch (e) {
          console.warn('Failed to update tournament count:', e);
        }

        // refresh authoritative data
        await fetchTournamentData();
      } catch (error: any) {
        console.error('Registration error:', error);
        toast.error(error?.message || 'Registration failed');
      } finally {
        setRegistering(false);
      }
    });
  };

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-slate-400 mt-4">Loading tournament...</p>
        </div>
      </div>
    );
  }

  const canRegister = tournament.status === 'registration_open' &&
    tournament.current_participants < tournament.max_participants &&
    !isRegistered &&
    profile?.role === 'competitor';

  const isOrganizer = profile?.id === tournament.organizer_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('tournaments')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Tournaments
        </button>

        <div className="relative h-80 rounded-2xl overflow-hidden mb-8">
          <img
            src={tournament.banner_url || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1200'}
            alt={tournament.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>

          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  {tournament.game?.icon_url && (
                    <img
                      src={tournament.game.icon_url}
                      alt={tournament.game.name}
                      className="w-16 h-16 rounded-xl border-2 border-white/20 object-cover"
                    />
                  )}
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{tournament.name}</h1>
                    <div className="flex items-center gap-4 text-slate-300">
                      <span className="flex items-center gap-1">
                        <Gamepad2 size={16} />
                        {tournament.game?.name}
                      </span>
                      {tournament.region && (
                        <span className="flex items-center gap-1">
                          <MapPin size={16} />
                          {tournament.region}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        {formatInUserTZ(tournament.start_date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {isOrganizer && (
                  <button
                    onClick={() => onNavigate('manage-tournament', tournament.id)}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/40"
                  >
                    Manage Tournament
                  </button>
                )}

                {canRegister && (
                  <button
                    onClick={() => requireAuth(user, () => setShowAuthModal(true), handleRegister)}
                    disabled={registering}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {registering ? 'Registering...' : 'Register Now'}
                  </button>
                )}

                {isRegistered && (
                  <div className="px-6 py-3 bg-green-500/20 text-green-400 border border-green-500/50 font-bold rounded-xl">
                    Registered
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: Info },
            { id: 'participants', label: 'Participants', icon: Users },
            { id: 'brackets', label: 'Brackets', icon: Trophy },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'streams', label: 'Streams', icon: Tv },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40'
                    : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50 hover:text-white border border-blue-500/20'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8">
          {activeTab === 'overview' && (
            <OverviewTab tournament={tournament} participants={participants} loading={loading} />
          )}
          {activeTab === 'participants' && (
            <ParticipantsTab participants={participants} participantType={tournament.participant_type} loading={loading} />
          )}
          {activeTab === 'brackets' && (
            <BracketsTab matches={matches} participants={participants} format={tournament.format} loading={loading} />
          )}
          {activeTab === 'schedule' && (
            <ScheduleTab matches={matches} />
          )}
          {activeTab === 'streams' && (
            <StreamsTab streamUrl={tournament.stream_url} />
          )}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
        initialRole="competitor"
      />
    </div>
  );
}

function OverviewTab({ tournament, participants, loading }: { tournament: Tournament, participants: TournamentParticipant[], loading?: boolean }) {
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-blue-400" size={24} />
              <h3 className="text-slate-300 font-medium">Participants</h3>
            </div>
            <div className="h-8 w-20"><div className="bg-slate-800 animate-pulse h-full rounded" /></div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="text-yellow-400" size={24} />
              <h3 className="text-slate-300 font-medium">Prize Pool</h3>
            </div>
            <div className="h-12 w-36"><div className="bg-slate-800 animate-pulse h-full rounded" /></div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-blue-400" size={24} />
              <h3 className="text-slate-300 font-medium">Format</h3>
            </div>
            <div className="h-8 w-40"><div className="bg-slate-800 animate-pulse h-full rounded" /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-blue-400" size={24} />
            <h3 className="text-slate-300 font-medium">Participants</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {participants.length}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="text-yellow-400" size={24} />
            <h3 className="text-slate-300 font-medium">Prize Pool</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            {tournament.prize_pool || 'TBD'}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-blue-400" size={24} />
            <h3 className="text-slate-300 font-medium">Format</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {tournament.format.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </p>
        </div>
      </div>

      {tournament.description && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">About</h2>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
            {tournament.description}
          </p>
        </div>
      )}

      {tournament.rules && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Rules</h2>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-500/20">
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {tournament.rules}
            </p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Tournament Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-slate-300">
            <Calendar className="text-blue-400" size={20} />
            <div>
                <p className="text-sm text-slate-400">Start Date</p>
                <p className="font-semibold">{formatInUserTZ(tournament.start_date)}</p>
                <p className="text-sm text-slate-400">{relativeTimeFromNow(tournament.start_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Calendar className="text-blue-400" size={20} />
            <div>
                <p className="text-sm text-slate-400">End Date</p>
                <p className="font-semibold">{formatInUserTZ(tournament.end_date)}</p>
                <p className="text-sm text-slate-400">{relativeTimeFromNow(tournament.end_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Calendar className="text-blue-400" size={20} />
            <div>
                <p className="text-sm text-slate-400">Registration Start</p>
                <p className="font-semibold">{tournament.registration_start ? formatInUserTZ(tournament.registration_start) : 'TBD'}</p>
                <p className="text-sm text-slate-400">{tournament.registration_start ? relativeTimeFromNow(tournament.registration_start) : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Calendar className="text-blue-400" size={20} />
            <div>
                <p className="text-sm text-slate-400">Registration End</p>
                <p className="font-semibold">{tournament.registration_end ? formatInUserTZ(tournament.registration_end) : 'TBD'}</p>
                <p className="text-sm text-slate-400">{tournament.registration_end ? relativeTimeFromNow(tournament.registration_end) : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <User className="text-blue-400" size={20} />
            <div>
              <p className="text-sm text-slate-400">Organizer</p>
              <p className="font-semibold">{tournament.organizer?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Users className="text-blue-400" size={20} />
            <div>
              <p className="text-sm text-slate-400">Type</p>
              <p className="font-semibold capitalize">{tournament.participant_type}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantsTab({ participants, participantType, loading }: { participants: TournamentParticipant[], participantType: string, loading?: boolean }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">
        Registered {participantType === 'team' ? 'Teams' : 'Players'} ({participants.length})
      </h2>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12"><div className="bg-slate-800 animate-pulse w-12 h-12 rounded" /></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-800 animate-pulse w-32 rounded mb-2" />
                  <div className="h-3 bg-slate-800 animate-pulse w-20 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center py-12">
          <Users size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No participants registered yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-4 hover:bg-slate-800/70 transition-colors"
            >
              {participantType === 'team' && participant.team ? (
                <div className="flex items-center gap-3">
                  {participant.team.logo_url && (
                    <img
                      src={participant.team.logo_url}
                      alt={participant.team.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{participant.team.name}</h3>
                    <p className="text-sm text-slate-400">{participant.team.tag}</p>
                  </div>
                  {participant.seed && (
                    <div className="text-blue-400 font-bold text-lg">#{participant.seed}</div>
                  )}
                </div>
              ) : participant.user ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12">
                    <Avatar src={participant.user.avatar_url} username={participant.user.username} size={48} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{participant.user.username}</h3>
                    <p className="text-sm text-slate-400">
                      {participant.user.region || 'No region'}
                    </p>
                  </div>
                  {participant.seed && (
                    <div className="text-blue-400 font-bold text-lg">#{participant.seed}</div>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BracketsTab({ matches, participants, format, loading }: { matches: Match[], participants: TournamentParticipant[], format: string, loading?: boolean }) {
  // If no persisted matches, generate a visual bracket on the client
  let usedMatches = matches;
  if (matches.length === 0 && participants.length > 0 && format === 'single_elimination') {
    usedMatches = generateSingleElimination(participants);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Brackets</h2>
        <div className="flex gap-6 overflow-x-auto pb-6">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="min-w-[260px] space-y-4">
              <div className="h-6 w-24 bg-slate-800 animate-pulse rounded" />
              {[...Array(3)].map((__, j) => (
                <div key={j} className="h-20 bg-slate-800 rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (usedMatches.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy size={48} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Brackets will be generated once registration closes</p>
      </div>
    );
  }

  const rounds = Array.from(new Set(usedMatches.map(m => m.round))).sort((a, b) => a - b);

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">
        {format.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Bracket
      </h2>

      <div className="flex gap-6 overflow-x-auto pb-6">
        {rounds.map((round) => {
          const roundMatches = usedMatches.filter(m => m.round === round);
          return (
            <div key={round} className="flex flex-col gap-6 min-w-[260px]">
              <h3 className="text-xl font-bold text-blue-400">Round {round}</h3>
              {roundMatches.map((match) => {
                // ensure participant objects are attached when possible
                if (!match.participant1 && match.participant1_id) {
                  match.participant1 = participants.find(p => p.id === match.participant1_id);
                }
                if (!match.participant2 && match.participant2_id) {
                  match.participant2 = participants.find(p => p.id === match.participant2_id);
                }

                return (
                  <MatchCard key={match.id} match={match} />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ScheduleTab component moved to src/components/tournament/ScheduleTab.tsx

function StreamsTab({ streamUrl }: { streamUrl: string | null }) {
  if (!streamUrl) {
    return (
      <div className="text-center py-12">
        <Tv size={48} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No stream available for this tournament</p>
      </div>
    );
  }

  let embedUrl = streamUrl;

  if (streamUrl.includes('twitch.tv')) {
    const channelMatch = streamUrl.match(/twitch\.tv\/([^/?]+)/);
    if (channelMatch) {
      embedUrl = `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=${window.location.hostname}`;
    }
  } else if (streamUrl.includes('youtube.com')) {
    const videoIdMatch = streamUrl.match(/[?&]v=([^&]+)/);
    if (videoIdMatch) {
      embedUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}`;
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Live Stream</h2>
      <div className="aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen"
        />
      </div>
    </div>
  );
}
