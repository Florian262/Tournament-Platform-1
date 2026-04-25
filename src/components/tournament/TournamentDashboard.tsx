import { useEffect, useState } from 'react';
import {
  Trophy, Users, Calendar, Tv, Info, ArrowLeft,
  Shield, ExternalLink,
  Clock, Award, ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatInUserTZ, relativeTimeFromNow } from '../../utils/time';
import { Tournament, TournamentParticipant, Match } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useUserTeams } from '../../hooks/useTeams';
import { useQueryClient } from '@tanstack/react-query';
import AuthModal from '../auth/AuthModal';
import QuickJoinModal from './QuickJoinModal';
import requireAuth from '../../utils/actionGate';
import toast from 'react-hot-toast';
import generateSingleElimination from '../../utils/bracketGenerator';
import InteractiveBracket from './InteractiveBracket';
import ScheduleTab from './ScheduleTab';
import Avatar from '../ui/Avatar';

interface TournamentDashboardProps {
  tournamentId: string;
  onNavigate: (page: string, data?: unknown) => void;
}

type TabType = 'overview' | 'participants' | 'brackets' | 'schedule' | 'streams';

export default function TournamentDashboard({ tournamentId, onNavigate }: TournamentDashboardProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { sendNotification } = useNotifications();
  const { data: userTeams = [] } = useUserTeams(user?.id);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showQuickJoin, setShowQuickJoin] = useState(false);

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId, userTeams]);

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

      if (user && tournamentData) {
        if (tournamentData.participant_type === 'team') {
          const isTeamReg = participantsData.some((p: any) => 
            p.team_id && userTeams.some((ut: any) => ut.id === p.team_id)
          );
          setIsRegistered(isTeamReg);
        } else {
          const userParticipant = participantsData.find((p: any) => p.user_id === user.id);
          setIsRegistered(!!userParticipant);
        }
      }
    }

    const { data: matchesData } = await supabase
      .from('matches')
      .select('*, participant1:tournament_participants(*), participant2:tournament_participants(*), match_results(*)')
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true });

    if (matchesData) {
      setMatches(matchesData);
    }

    setLoading(false);
  };

  const handleRegister = async () => {
    requireAuth(user, () => setShowAuthModal(true), async () => {
      if (!tournament) return;

      if (tournament.participant_type === 'team') {
        setShowQuickJoin(true);
        return;
      }

      try {
        const { count, error: countError } = await supabase
          .from('tournament_participants')
          .select('id', { count: 'exact' })
          .eq('tournament_id', tournament.id);

        if (countError) throw countError;
        if (typeof count === 'number' && count >= tournament.max_participants) {
          toast.error('Operation Capacity Reached');
          return;
        }
      } catch (err: any) {
        toast.error(err?.message || 'Verification Failed');
        return;
      }

      setRegistering(true);
      const originalCount = tournament.current_participants;

      try {
        setTournament(prev => prev ? { ...prev, current_participants: prev.current_participants + 1 } : prev);

        const { error: insertError } = await supabase
          .from('tournament_participants')
          .insert({
            tournament_id: tournament.id,
            user_id: user!.id,
            status: 'registered',
          });

        if (insertError) {
          if ((insertError as any).code === '23505' || (insertError as any).message?.toLowerCase().includes('duplicate')) {
            toast.success('Clearance Confirmed: Already Registered');
            setIsRegistered(true);
          } else {
            setTournament(prev => prev ? { ...prev, current_participants: originalCount } : prev);
            throw insertError;
          }
        } else {
          setIsRegistered(true);
          toast.success('Registration Successfully Initialized');

          await sendNotification.mutateAsync({
            user_id: user!.id,
            type: 'tournament_update',
            title: 'Deployment Confirmed',
            message: `You have been officially registered for ${tournament.name}. Prepare for battle!`,
            link: `tournament-detail/${tournament.id}`
          });
        }

        await queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        await fetchTournamentData();
      } catch (error: any) {
        toast.error(error?.message || 'Registration Denied');
      } finally {
        setRegistering(false);
      }
    });
  };

  const handleQuickJoinSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    fetchTournamentData();
  };

  if (loading && !tournament) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <Trophy className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500" size={32} />
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  const canRegister = tournament.status === 'registration_open' &&
    tournament.current_participants < tournament.max_participants &&
    !isRegistered &&
    profile?.role === 'competitor';

  const isOrganizer = profile?.id === tournament.organizer_id;

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      {/* Cinematic Hero Header */}
      <div className="relative h-[450px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={tournament.banner_url || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1200'}
            alt=""
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-12">
          <button
            onClick={() => onNavigate('tournaments')}
            className="absolute top-24 left-4 sm:left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-all group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Return to Base</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                 {tournament.game?.icon_url && (
                    <div className="p-1 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                      <img
                        src={tournament.game.icon_url}
                        alt=""
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-[10px] font-black text-blue-400 uppercase tracking-widest italic">
                        {tournament.game?.short_name} • {tournament.region || 'GLOBAL'}
                      </span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic text-white leading-none">
                      {tournament.name}
                    </h1>
                  </div>
              </div>

              <div className="flex flex-wrap gap-6 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-blue-500" />
                  {formatInUserTZ(tournament.start_date)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-blue-500" />
                  {relativeTimeFromNow(tournament.start_date)}
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-blue-500" />
                  {tournament.format.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
               {isOrganizer && (
                <button
                  onClick={() => onNavigate('manage-tournament', tournament.id)}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest italic text-[10px] rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-2"
                >
                  <Shield size={16} /> Admin Console
                </button>
              )}

              {canRegister ? (
                <button
                  onClick={() => requireAuth(user, () => setShowAuthModal(true), handleRegister)}
                  disabled={registering}
                  className="group px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest italic text-xs rounded-2xl transition-all shadow-2xl shadow-blue-500/40 active:scale-95 disabled:opacity-50 flex items-center gap-3"
                >
                  {registering ? 'Processing Link...' : 'Initialize Registration'}
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </button>
              ) : isRegistered ? (
                <div className="px-10 py-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase tracking-widest italic text-xs rounded-2xl flex items-center gap-3">
                  <Shield size={18} /> Clearance Confirmed
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pb-20">
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide">
          {[
            { id: 'overview', label: 'Briefing', icon: Info },
            { id: 'participants', label: 'Roster', icon: Users },
            { id: 'brackets', label: 'Tactical', icon: Trophy },
            { id: 'schedule', label: 'Timeline', icon: Calendar },
            { id: 'streams', label: 'Surveillance', icon: Tv },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] italic transition-all whitespace-nowrap border ${
                activeTab === tab.id
                  ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20'
                  : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          {activeTab === 'overview' && (
            <OverviewTab tournament={tournament} participants={participants} />
          )}
          {activeTab === 'participants' && (
            <ParticipantsTab participants={participants} participantType={tournament.participant_type} />
          )}
          {activeTab === 'brackets' && (
            <BracketsTab matches={matches} participants={participants} format={tournament.format} />
          )}
          {activeTab === 'schedule' && (
            <ScheduleTab 
              matches={matches} 
              participants={participants} 
              onRefresh={fetchTournamentData}
              isOrganizer={isOrganizer}
            />
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

      {tournament && user && (
        <QuickJoinModal 
          isOpen={showQuickJoin}
          onClose={() => setShowQuickJoin(false)}
          tournament={tournament}
          user={user}
          onSuccess={handleQuickJoinSuccess}
        />
      )}
    </div>
  );
}

function OverviewTab({ tournament, participants }: { tournament: Tournament, participants: TournamentParticipant[] }) {
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Combatants', value: `${participants.length} / ${tournament.max_participants}`, icon: Users, color: 'text-blue-500' },
          { label: 'Combat Rewards', value: tournament.prize_pool || 'HONOR ONLY', icon: Award, color: 'text-amber-500' },
          { label: 'Tactical Format', value: tournament.format.replace('_', ' '), icon: Trophy, color: 'text-blue-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/5 rounded-[2rem] p-8 group hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
              <stat.icon className={stat.color} size={20} />
            </div>
            <p className="text-3xl font-black uppercase tracking-tighter italic text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-12">
          {tournament.description && (
            <div>
              <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3 italic">
                <span className="w-8 h-px bg-blue-500/30" /> Mission Objective
              </h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] leading-loose whitespace-pre-wrap">
                {tournament.description}
              </p>
            </div>
          )}

          {tournament.rules && (
            <div>
              <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3 italic">
                <span className="w-8 h-px bg-blue-500/30" /> Rules of Engagement
              </h2>
              <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] leading-loose whitespace-pre-wrap">
                  {tournament.rules}
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
           <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3 italic">
              <span className="w-8 h-px bg-blue-500/30" /> Operation Intel
            </h2>
            <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-8">
              {[
                { label: 'Target Launch', date: tournament.start_date },
                { label: 'Exfil Complete', date: tournament.end_date },
                { label: 'Registration Open', date: tournament.registration_start },
                { label: 'Registration Close', date: tournament.registration_end },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest italic">{item.date ? formatInUserTZ(item.date) : 'TBD'}</p>
                    {item.date && <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest mt-1">{relativeTimeFromNow(item.date)}</p>}
                  </div>
                </div>
              ))}
              
              <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead Organizer</span>
                <div className="flex items-center gap-3">
                   <Avatar src={tournament.organizer?.avatar_url} username={tournament.organizer?.username} size={28} />
                   <span className="text-[10px] font-black text-white uppercase tracking-widest italic">{tournament.organizer?.username}</span>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantsTab({ participants, participantType }: { participants: TournamentParticipant[], participantType: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">
          Registered <span className="text-blue-500">{participantType === 'team' ? 'Franchises' : 'Competitors'}</span>
        </h2>
        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Total Count: <span className="text-white">{participants.length}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="group bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all flex items-center justify-between"
          >
            {participantType === 'team' && participant.team ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-950 rounded-xl overflow-hidden border border-white/10">
                    {participant.team.logo_url ? (
                      <img src={participant.team.logo_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700 font-black">?</div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase italic text-white group-hover:text-blue-400 transition-colors leading-none mb-1">{participant.team.name}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{participant.team.tag}</span>
                  </div>
                </div>
              </>
            ) : participant.user ? (
              <>
                <div className="flex items-center gap-4">
                  <Avatar src={participant.user.avatar_url} username={participant.user.username} size={56} />
                  <div>
                    <h4 className="text-sm font-black uppercase italic text-white group-hover:text-blue-400 transition-colors leading-none mb-1">{participant.user.username}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{participant.user.region || 'GLOBAL'}</span>
                  </div>
                </div>
              </>
            ) : null}

            {participant.seed && (
              <div className="flex flex-col items-end leading-none">
                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">Seed</span>
                <span className="text-xl font-black italic text-white">#{participant.seed}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketsTab({ matches, participants, format }: { matches: Match[], participants: TournamentParticipant[], format: string }) {
  let usedMatches = matches;
  if (matches.length === 0 && participants.length > 0 && format === 'single_elimination') {
    usedMatches = generateSingleElimination(participants);
  }

  if (usedMatches.length === 0) {
    return (
      <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
        <Trophy size={48} className="text-slate-800 mx-auto mb-4" />
        <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-500">Bracket Under Construction</h3>
        <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px] mt-2">Tactical deployment starts after registration concludes</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white">Tactical <span className="text-blue-500">Grid</span></h2>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <Shield size={12} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{format.replace('_', ' ')}</span>
           </div>
        </div>
      </div>
      <InteractiveBracket matches={usedMatches} participants={participants} />
    </div>
  );
}

function StreamsTab({ streamUrl }: { streamUrl: string | null }) {
  if (!streamUrl) {
    return (
      <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
        <Tv size={48} className="text-slate-800 mx-auto mb-4" />
        <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-500">Signal Lost</h3>
        <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px] mt-2">No active surveillance feed detected for this operation</p>
      </div>
    );
  }

  let embedUrl = streamUrl;
  if (streamUrl.includes('twitch.tv')) {
    const channelMatch = streamUrl.match(/twitch\.tv\/([^/?]+)/);
    if (channelMatch) embedUrl = `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=${window.location.hostname}`;
  } else if (streamUrl.includes('youtube.com')) {
    const videoIdMatch = streamUrl.match(/[?&]v=([^&]+)/);
    if (videoIdMatch) embedUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Live <span className="text-red-500 animate-pulse">Surveillance</span></h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all">
          <ExternalLink size={14} /> Outer Link
        </button>
      </div>
      <div className="aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
        <iframe src={embedUrl} className="w-full h-full" title="Tournament Stream" allowFullScreen allow="autoplay; fullscreen" />
      </div>
    </div>
  );
}
