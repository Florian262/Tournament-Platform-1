import { useEffect, useState } from 'react';
import { ArrowLeft, Trophy, Award, DollarSign, Percent } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserProfile, PlayerStatistics, Tournament } from '../types';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

interface PlayerProfilePageProps {
  userId: string;
  onNavigate: (page: string, data?: unknown) => void;
}

export default function PlayerProfilePage({ userId, onNavigate }: PlayerProfilePageProps) {
  const { profile: currentProfile, refreshProfile } = useAuth();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<PlayerStatistics | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: '', full_name: '', bio: '', region: '', avatar_url: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPlayerData();
  }, [userId]);

  const fetchPlayerData = async () => {
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userData && userData.display_stats) {
      setUser(userData);
      setForm({
        username: userData.username || '',
        full_name: userData.full_name || '',
        bio: userData.bio || '',
        region: userData.region || '',
        avatar_url: userData.avatar_url || '',
      });
    } else {
      setLoading(false);
      return;
    }

    const { data: statsData } = await supabase
      .from('player_statistics')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (statsData) setStats(statsData);

    const { data: participationData } = await supabase
      .from('tournament_participants')
      .select('tournament_id')
      .eq('user_id', userId)
      .limit(10);

    if (participationData && participationData.length > 0) {
      const tournamentIds = participationData.map(p => p.tournament_id);
      const { data: tournamentsData } = await supabase
        .from('tournaments')
        .select('*, game:games(*)')
        .in('id', tournamentIds);

      if (tournamentsData) setTournaments(tournamentsData);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-slate-400 mt-4">Loading player...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">Player profile is private or not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-900 relative">
            <div className="absolute bottom-0 left-8 transform translate-y-1/2">
              <div>
                <Avatar src={user.avatar_url} username={user.username} size={96} className="border-4 border-slate-900" />
              </div>
            </div>
          </div>

          <div className="pt-16 px-8 pb-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold text-white mb-1">{user.username}</h1>
                  <div className="relative text-sm text-slate-400 bg-slate-800/40 px-2 py-1 rounded-lg flex items-center gap-2">
                    <span className="font-mono text-xs">{user.id}</span>
                    <button
                      onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(user.id);
                              setCopied(true);
                              toast.success('Copied ID to clipboard');
                              setTimeout(() => setCopied(false), 2000);
                            } catch (err: any) {
                              console.error('Clipboard copy failed', err);
                              toast.error(err?.message || 'Failed to copy ID');
                            }
                      }}
                      title="Copy ID"
                      className="p-1 rounded hover:bg-slate-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    {copied && <span className="ml-2 text-xs text-green-400">Copied!</span>}
                  </div>
                </div>
                {user.full_name && (
                  <p className="text-slate-400">{user.full_name}</p>
                )}
                {user.full_name && (
                  <p className="text-slate-400">{user.full_name}</p>
                )}
                {user.region && (
                  <p className="text-slate-400">📍 {user.region}</p>
                )}
              </div>

              {/* Edit controls: allow owner or admin to edit */}
              {((currentProfile && currentProfile.id === user.id) || currentProfile?.role === 'admin') && (
                <div className="ml-4">
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          // save
                          try {
                            const updates = {
                              username: form.username,
                              full_name: form.full_name || null,
                              bio: form.bio || null,
                              region: form.region || null,
                              avatar_url: form.avatar_url || null,
                            };
                            const { error } = await supabase
                              .from('user_profiles')
                              .update(updates)
                              .eq('id', user.id);

                            if (error) throw error;
                            // refresh data
                            await fetchPlayerData();
                            if (currentProfile && currentProfile.id === user.id) {
                              await refreshProfile();
                            }
                            setEditing(false);
                          } catch (err: any) {
                            console.error('Error updating profile:', err);
                            toast.error(err?.message || 'Failed to update profile');
                          }
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          // cancel: restore form from user
                          setForm({
                            username: user.username || '',
                            full_name: user.full_name || '',
                            bio: user.bio || '',
                            region: user.region || '',
                            avatar_url: user.avatar_url || '',
                          });
                          setEditing(false);
                        }}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {editing ? (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Username</label>
                  <input value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Full name</label>
                  <input value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Region</label>
                  <input value={form.region} onChange={(e) => setForm({...form, region: e.target.value})} className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Avatar URL</label>
                  <input value={form.avatar_url} onChange={(e) => setForm({...form, avatar_url: e.target.value})} className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Bio</label>
                  <textarea value={form.bio} onChange={(e) => setForm({...form, bio: e.target.value})} className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white" rows={4} />
                </div>
              </div>
            ) : (
              user.bio && (
                <p className="text-slate-300 mb-6 text-lg leading-relaxed">{user.bio}</p>
              )
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="text-yellow-400" size={20} />
                  <span className="text-sm text-slate-400">Tournaments</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {stats?.total_tournaments || 0}
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="text-green-400" size={20} />
                  <span className="text-sm text-slate-400">Wins</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {stats?.total_wins || 0}
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="text-blue-400" size={20} />
                  <span className="text-sm text-slate-400">Win Rate</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {stats ? (stats.win_rate * 100).toFixed(1) : 0}%
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-yellow-500" size={20} />
                  <span className="text-sm text-slate-400">Prize Money</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${(stats?.total_prizes || 0).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {tournaments.length > 0 && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Tournament History</h2>

            <div className="space-y-3">
              {tournaments.map((tournament) => (
                <button
                  key={tournament.id}
                  onClick={() => onNavigate('tournament-detail', tournament.id)}
                  className="w-full text-left bg-slate-800/50 rounded-xl p-4 border border-blue-500/20 hover:bg-slate-800/70 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-lg">{tournament.name}</h3>
                      <p className="text-sm text-slate-400">
                        {tournament.game?.name} • {new Date(tournament.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      tournament.status === 'completed' ? 'bg-slate-500/20 text-slate-400' :
                      tournament.status === 'running' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {tournament.status.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
