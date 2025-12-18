import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Trophy, Award, DollarSign, Percent, X, Check, Trash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Team, TeamMember, TeamStatistics } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface TeamProfilePageProps {
  teamId: string;
  onNavigate: (page: string) => void;
}

export default function TeamProfilePage({ teamId, onNavigate }: TeamProfilePageProps) {
  const { profile } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const { data: teamData, error: teamErr } = await supabase
        .from('teams')
        .select('*, owner:user_profiles(*), game:games(*)')
        .eq('id', teamId)
        .maybeSingle();

      if (teamErr) {
        console.error('teams fetch error', teamErr);
        toast.error('Failed to load team');
      }
      if (teamData) setTeam(teamData);

      const { data: membersData, error: membersErr } = await supabase
        .from('team_members')
        .select('*, user:user_profiles(*)')
        .eq('team_id', teamId)
        .order('role', { ascending: true });

      if (membersErr) {
        console.error('team_members fetch error', membersErr);
        // try a simpler projection as a fallback
        try {
          const { data: fallbackData, error: fallbackErr } = await supabase
            .from('team_members')
            .select('id, team_id, user_id, role')
            .eq('team_id', teamId);
          if (fallbackErr) {
            console.error('team_members fallback error', fallbackErr);
            toast.error('Failed to load team members');
          }
          if (fallbackData) setMembers(fallbackData as any);
        } catch (fErr) {
          console.error('fallback fetch failed', fErr);
        }
      } else {
        if (membersData) setMembers(membersData);
      }

      const { data: statsData, error: statsErr } = await supabase
        .from('team_statistics')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle();
      if (statsErr) {
        console.error('team_statistics fetch error', statsErr);
        toast.error('Failed to load team statistics');
      }

      const { data: invitesData, error: invitesErr } = await supabase
        .from('team_invites')
        .select('*, invited:user_profiles(*), inviter:user_profiles(*)')
        .eq('team_id', teamId)
        .eq('status', 'pending');

      if (invitesErr) {
        console.error('team_invites fetch error', invitesErr);
        toast.error('Failed to load pending invites');
      }
      if (invitesData) setInvites(invitesData);
      if (statsData) setStats(statsData);
    } catch (err: any) {
      console.error('fetchTeamData unexpected error', err);
      toast.error(err?.message || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const isUserCaptain = () => {
    if (!profile) return false;
    return members.some(m => m.user_id === profile.id && m.role === 'captain');
  };

    const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0 || !team) return;
      if (!profile || profile.id !== team.owner_id) return toast.error('Only owners can update team avatar');
      const file = e.target.files[0];
      setUploading(true);
      try {
        const filePath = `team-avatars/${team.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('team-avatars').upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = await supabase.storage.from('team-avatars').getPublicUrl(filePath);
        const publicUrl = publicUrlData.publicUrl;
        const { error: updateError } = await supabase.from('teams').update({ logo_url: publicUrl }).eq('id', team.id);
        if (updateError) throw updateError;
        await fetchTeamData();
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    };

    const respondInvite = async (inviteId: string, status: 'accepted' | 'rejected') => {
      if (!team) return;
      try {
        const { error: updError } = await supabase.from('team_invites').update({ status, responded_at: new Date().toISOString() }).eq('id', inviteId);
        if (updError) throw updError;
        if (status === 'accepted') {
          // fetch invite to find invited_user
          const { data: inv } = await supabase.from('team_invites').select('*').eq('id', inviteId).maybeSingle();
          if (inv) {
            // Upsert member to avoid duplicate key if DB trigger already created it.
            const { error: memberError } = await supabase.from('team_members').upsert({ team_id: team.id, user_id: inv.invited_user_id, role: inv.role }, { onConflict: 'team_id, user_id', ignoreDuplicates: true });
            if (memberError) throw memberError;

            // Ensure a statistics row exists; DB trigger may have created it already.
            const { error: statsUpsertErr } = await supabase.from('team_statistics').upsert({ team_id: team.id, member_count: 1 }, { onConflict: 'team_id', ignoreDuplicates: true });
            if (statsUpsertErr) throw statsUpsertErr;
          }
        }
        await fetchTeamData();
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || 'Failed to respond to invite');
      }
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-slate-400 mt-4">Loading team...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => onNavigate('tournaments')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">Team not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('tournaments')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl overflow-hidden mb-8">
          <div className="h-48 bg-gradient-to-r from-blue-600 to-blue-900 relative">
            {team.logo_url && (
              <img
                src={team.logo_url}
                alt={team.name}
                className="absolute bottom-0 left-8 w-32 h-32 rounded-xl border-4 border-slate-900 object-cover"
              />
            )}
          </div>

          <div className="pt-20 px-8 pb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{team.name}</h1>
                <p className="text-2xl text-blue-400 font-bold">{team.tag}</p>
                {team.game && (
                  <p className="text-slate-400 mt-2 flex items-center gap-2">
                    {team.game.name} • {team.region || 'Global'}
                  </p>
                )}
              </div>
            </div>

            {team.description && (
              <p className="text-slate-300 mb-6 text-lg leading-relaxed">{team.description}</p>
            )}

            {profile && profile.id === team.owner_id && (
              <div className="mb-4">
                <label className="block text-sm text-slate-300 mb-2">Team Avatar</label>
                <input type="file" accept="image/*" onChange={handleUploadAvatar} />
                {uploading && <p className="text-sm text-slate-400 mt-2">Uploading...</p>}
              </div>
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

        <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white mb-0 flex items-center gap-2">
              <Users size={28} className="text-blue-500" />
              Team Members ({members.length})
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={fetchTeamData} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded">Refresh</button>
            </div>
          </div>

            {profile && (profile.id === team.owner_id || isUserCaptain() || profile.role === 'admin') && (
            <div className="mb-6 bg-slate-800/50 p-4 rounded-lg border border-blue-500/20">
              <h3 className="font-semibold text-white mb-2">Pending Invites</h3>
              {invites.length === 0 ? (
                <p className="text-slate-400">No pending invites</p>
              ) : (
                <div className="space-y-2">
                  {invites.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 justify-between bg-slate-900/50 p-3 rounded-lg">
                      <div>
                        <div className="font-bold text-white">{inv.invited?.username}</div>
                        <div className="text-slate-400 text-sm">Requested at {new Date(inv.created_at).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => respondInvite(inv.id, 'accepted')} className="px-3 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"><Check /> Accept</button>
                        <button onClick={() => respondInvite(inv.id, 'rejected')} className="px-3 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2"><X /> Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No team members found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/20 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {member.user?.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{member.user?.username}</h3>
                      <p className="text-sm text-slate-400 capitalize">
                        {member.user?.region && ` • ${member.user.region}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {profile && team && profile.id === team.owner_id && (
                        <>
                          <select
                            value={member.role}
                            onChange={async (e) => {
                              const newRole = e.target.value as any;
                              const { error } = await supabase.from('team_members').update({ role: newRole }).eq('id', member.id);
                              if (error) {
                                toast.error(error.message || 'Failed to update role');
                                return;
                              }
                              await fetchTeamData();
                            }}
                            className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 mr-2"
                          >
                            <option value="captain">captain</option>
                            <option value="player">player</option>
                            <option value="substitute">substitute</option>
                          </select>
                          <button
                            onClick={async () => {
                              if (!team) return;
                              if (member.user_id === team.owner_id) {
                                toast.error('Cannot remove owner');
                                return;
                              }
                              const { error } = await supabase.from('team_members').delete().eq('id', member.id);
                              if (error) {
                                toast.error(error.message || 'Failed to remove member');
                                return;
                              }
                              // decrement stats
                              const { data: statsData } = await supabase.from('team_statistics').select('member_count').eq('team_id', team.id).maybeSingle();
                              if (statsData) {
                                await supabase.from('team_statistics').update({ member_count: Math.max(0, (statsData.member_count || 1) - 1) }).eq('team_id', team.id);
                              }
                              await fetchTeamData();
                            }}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                            title="Remove member"
                          >
                            <Trash />
                          </button>
                        </>
                      )}
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        member.role === 'captain'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
