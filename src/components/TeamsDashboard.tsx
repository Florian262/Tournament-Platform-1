import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Team } from '../types';
import { useAuth } from '../contexts/AuthContext';
import TeamManagementModal from './TeamManagmentModel';
import toast from 'react-hot-toast';

interface TeamsDashboardProps {
  onNavigate: (page: string, data?: unknown) => void;
}


export default function TeamsDashboard({ onNavigate }: TeamsDashboardProps) {
  const { user, profile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [captainTeamIds, setCaptainTeamIds] = useState<string[]>([]);
  const [pendingInvitesMap, setPendingInvitesMap] = useState<Record<string, any[]>>({});
  const [openInvitesTeamId, setOpenInvitesTeamId] = useState<string | null>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedGame, page]);

  const fetchData = async () => {
    setLoading(true);
    // fetch games for filtering
    const { data: gamesData } = await supabase.from('games').select('*').order('name');
    if (gamesData) setGames(gamesData);

    // count total
    let countQuery = supabase.from('teams').select('id', { count: 'exact', head: true });
    if (selectedGame) countQuery = countQuery.eq('game_id', selectedGame);
    if (query.trim()) countQuery = countQuery.ilike('name', `%${query}%`);
    const countRes = await countQuery;
    if (countRes && typeof countRes.count === 'number') setTotal(countRes.count);

    // fetch paginated
    let q = supabase.from('teams').select('*, owner:user_profiles(*), game:games(*)').order('name').range((page - 1) * pageSize, page * pageSize - 1);
    if (selectedGame) q = q.eq('game_id', selectedGame);
    if (query.trim()) q = q.ilike('name', `%${query}%`);

    const { data: teamsData } = await q;
    if (teamsData) setTeams(teamsData);

    // if we have a logged-in profile, fetch teams where they are captain and pending invites for teams they manage
    if (profile && teamsData && teamsData.length > 0) {
      const teamIds = teamsData.map((t: any) => t.id);

      // fetch captain memberships for the current user within the listed teams
      const { data: captainData } = await supabase
        .from('team_members')
        .select('team_id')
        .in('team_id', teamIds)
        .eq('user_id', profile.id)
        .eq('role', 'captain');

      const captainIds = (captainData || []).map((r: any) => r.team_id);
      setCaptainTeamIds(captainIds);

      // determine which teams this user can manage (owner + captain)
      const ownerIds = teamsData.filter((t: any) => t.owner_id === profile.id).map((t: any) => t.id);
      const managedIds = Array.from(new Set([...ownerIds, ...captainIds]));

      if (managedIds.length > 0) {
        const { data: invites } = await supabase
          .from('team_invites')
          .select('*, invited:user_profiles(*), inviter:user_profiles(*)')
          .in('team_id', managedIds)
          .eq('status', 'pending');

        const map: Record<string, any[]> = {};
        (invites || []).forEach((inv: any) => {
          map[inv.team_id] = map[inv.team_id] || [];
          map[inv.team_id].push(inv);
        });
        setPendingInvitesMap(map);
      }
    }
    setLoading(false);
  };

  const refreshInvitesForTeam = async (teamId: string) => {
    const { data } = await supabase
      .from('team_invites')
      .select('*, invited:user_profiles(*), inviter:user_profiles(*)')
      .eq('team_id', teamId)
      .eq('status', 'pending');
    setPendingInvitesMap(prev => ({ ...prev, [teamId]: data || [] }));
  };

  const respondInvite = async (inviteId: string, status: 'accepted' | 'rejected', teamId: string) => {
    try {
      const { error: updError } = await supabase.from('team_invites').update({ status, responded_at: new Date().toISOString() }).eq('id', inviteId);
      if (updError) throw updError;

      if (status === 'accepted') {
        const { data: inv } = await supabase.from('team_invites').select('*').eq('id', inviteId).maybeSingle();
        if (inv) {
          const { error: memberError } = await supabase.from('team_members').insert({ team_id: teamId, user_id: inv.invited_user_id, role: inv.role });
          if (memberError) throw memberError;
          // increment stats
          const { data: statsData } = await supabase.from('team_statistics').select('member_count').eq('team_id', teamId).maybeSingle();
          if (statsData) {
            await supabase.from('team_statistics').update({ member_count: (statsData.member_count || 0) + 1 }).eq('team_id', teamId);
          }
        }
      }

      await refreshInvitesForTeam(teamId);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to respond to invite');
    }
  };

  const openCreateModal = () => {
    setShowTeamModal(true);
  };

  const handleTeamSelected = (teamId: string | null) => {
    if (teamId) onNavigate('team-profile', teamId);
  };

  

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Teams</h1>
          <div className="flex items-center gap-3">
            <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Create Team</button>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-blue-500/20 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search teams" className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white" />
            <select value={selectedGame ?? ''} onChange={(e) => setSelectedGame(e.target.value || null)} className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white">
              <option value="">All games</option>
              {games.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button onClick={fetchData} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">Filter</button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-800/30 rounded-xl p-4 h-40" />
            ))}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(team => (
                <div key={team.id} className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/20 flex flex-col">
                  <div className="flex items-center gap-3">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-12 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">{team.name?.[0]}</div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{team.name}</h3>
                      <p className="text-sm text-slate-400">{team.tag} • {team.game?.name || 'Any'}</p>
                    </div>
                  </div>

                  <p className="text-slate-300 mt-3 flex-1">{team.description || 'No description'}</p>

                  <div className="mt-4 flex items-center gap-2">
                    <button onClick={() => onNavigate('team-profile', team.id)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">View</button>
                    {user && (
                      <JoinRequestButton teamId={team.id} userId={user.id} />
                    )}
                    {/* pending invites badge / review for owners & captains */}
                    {profile && (profile.role === 'admin' || profile.id === team.owner_id || captainTeamIds.includes(team.id)) && (
                      <div className="ml-2 flex items-center gap-2">
                        <div className="text-sm text-slate-200 bg-yellow-800/20 px-2 py-1 rounded">{(pendingInvitesMap[team.id] || []).length} pending</div>
                        <button onClick={() => setOpenInvitesTeamId(openInvitesTeamId === team.id ? null : team.id)} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded">Review</button>
                      </div>
                    )}
                    {profile?.role === 'admin' && (
                      <button onClick={() => onNavigate('admin-dashboard', team.id)} className="ml-auto px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Manage</button>
                    )}
                  </div>
                  {/* inline invites panel */}
                  {openInvitesTeamId === team.id && (pendingInvitesMap[team.id] || []).length > 0 && (
                    <div className="mt-3 bg-slate-900/60 p-3 rounded-lg border border-blue-500/20">
                      {(pendingInvitesMap[team.id] || []).map(inv => (
                        <div key={inv.id} className="flex items-center justify-between gap-3 py-2">
                          <div>
                            <div className="font-semibold text-white">{inv.invited?.username || inv.invited_user_id}</div>
                            <div className="text-sm text-slate-400">Requested {new Date(inv.created_at).toLocaleString()}</div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => respondInvite(inv.id, 'accepted', team.id)} className="px-3 py-1 bg-green-600 text-white rounded">Accept</button>
                            <button onClick={() => respondInvite(inv.id, 'rejected', team.id)} className="px-3 py-1 bg-red-600 text-white rounded">Decline</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-slate-400">{total !== null ? `${Math.min((page-1)*pageSize+1, total)} - ${Math.min(page*pageSize, total)} of ${total}` : ''}</div>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-2 bg-slate-800 rounded-lg text-white disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={total !== null && page * pageSize >= total} className="px-3 py-2 bg-slate-800 rounded-lg text-white disabled:opacity-40">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <TeamManagementModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        gameId={selectedGame ?? ''}
        participantType="team"
        onTeamSelected={handleTeamSelected}
      />
    </div>
  );
}

function JoinRequestButton({ teamId, userId }: { teamId: string; userId: string }) {
  const [status, setStatus] = useState<'none' | 'member' | 'loading'>('loading');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: member } = await supabase.from('team_members').select('id').eq('team_id', teamId).eq('user_id', userId).maybeSingle();
      if (!mounted) return;
      if (member) {
        setStatus('member');
      } else {
        setStatus('none');
      }
    })();
    return () => { mounted = false; };
  }, [teamId, userId]);

  const joinTeam = async () => {
    setStatus('loading');
    try {
      // insert membership directly
      const { error: insertErr } = await supabase.from('team_members').insert({ team_id: teamId, user_id: userId, role: 'player' });
      if (insertErr) throw insertErr;

      // increment stats
      const { data: statsData } = await supabase.from('team_statistics').select('member_count').eq('team_id', teamId).maybeSingle();
      if (statsData) {
        await supabase.from('team_statistics').update({ member_count: (statsData.member_count || 0) + 1 }).eq('team_id', teamId);
      }

      setStatus('member');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to join team');
      setStatus('none');
    }
  };

  if (status === 'loading') return <button className="px-3 py-2 bg-slate-700 text-white rounded-lg">...</button>;
  if (status === 'member') return <div className="px-3 py-2 bg-green-700 text-white rounded-lg">Member</div>;
  return <button onClick={joinTeam} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Join</button>;
}
