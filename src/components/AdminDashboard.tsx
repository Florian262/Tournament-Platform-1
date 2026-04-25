import { useEffect, useState, useCallback } from 'react';
import { 
  Users, Shield, Activity, 
  Trophy, Hash, AlertTriangle, Search, Filter 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile, AuditLog } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

interface Stats {
  users: number;
  tournaments: number;
  teams: number;
  matches: number;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'overview'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats>({ users: 0, tournaments: 0, teams: 0, matches: 0 });
  const [actioningUserId, setActioningUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const [u, t, tm, m] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
    ]);

    setStats({
      users: u.count || 0,
      tournaments: t.count || 0,
      teams: tm.count || 0,
      matches: m.count || 0,
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await fetchStats();

    if (activeTab === 'users') {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setUsers(data);
    } else if (activeTab === 'logs') {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) setLogs(data);
    }

    setLoading(false);
  }, [activeTab, fetchStats]);

  useEffect(() => {
    if (authLoading) return;

    if (!profile || profile.role !== 'admin') {
      console.warn('Unauthorized access attempt to admin dashboard');
      onNavigate('home');
      return;
    }
    fetchData();
  }, [profile, authLoading, fetchData, onNavigate]);

  const handleChangeRole = async (userId: string, newRole: 'competitor' | 'organizer' | 'admin') => {
    setActioningUserId(userId);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      toast.success('Permissions updated');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActioningUserId('');
    }
  };

  const handleBanUser = async (userToBan: UserProfile) => {
    setActioningUserId(userToBan.id);
    const newBanStatus = !userToBan.is_banned;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_banned: newBanStatus,
          banned_at: newBanStatus ? new Date().toISOString() : null,
          banned_by: newBanStatus ? profile?.id : null
        })
        .eq('id', userToBan.id);
      
      if (error) throw error;
      toast.success(newBanStatus ? 'Identity suspended' : 'Identity restored');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActioningUserId('');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') return null;

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 selection:bg-red-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
              <Shield size={14} className="text-red-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500">System Authority</span>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter italic">Command <span className="text-red-600 text-glow-red">Center</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Platform-wide control and monitoring</p>
          </div>

          <div className="grid grid-cols-2 md:flex gap-4">
             <StatCard icon={Users} label="Users" value={stats.users} color="blue" />
             <StatCard icon={Trophy} label="Events" value={stats.tournaments} color="red" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5 w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: 'Personnel', icon: Users },
            { id: 'logs', label: 'History', icon: Hash },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest italic transition-all ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search personnel..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 text-sm font-medium"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                  <Filter size={16} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Filters: None</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                      <th className="pb-4 px-4 font-black">Identity</th>
                      <th className="pb-4 px-4 font-black">Clearance</th>
                      <th className="pb-4 px-4 font-black">Status</th>
                      <th className="pb-4 px-4 text-right font-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-black text-xs text-slate-400 group-hover:border-red-500/50 transition-colors">
                              {user.username.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black italic uppercase text-sm leading-none mb-1 group-hover:text-red-500 transition-colors">{user.username}</p>
                              <p className="text-[10px] text-slate-600 font-mono">{user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value as any)}
                            disabled={actioningUserId === user.id}
                            className="bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                          >
                            <option value="competitor">Player</option>
                            <option value="organizer">Organizer</option>
                            <option value="admin">System Admin</option>
                          </select>
                        </td>
                        <td className="py-5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                            user.is_banned ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'
                          }`}>
                            <div className={`w-1 h-1 rounded-full ${user.is_banned ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                            {user.is_banned ? 'Suspended' : 'Verified'}
                          </span>
                        </td>
                        <td className="py-5 px-4 text-right">
                          <button
                            onClick={() => handleBanUser(user)}
                            disabled={actioningUserId === user.id}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                              user.is_banned 
                                ? 'bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-600/20' 
                                : 'bg-white/5 text-slate-400 hover:bg-red-600 hover:text-white active:scale-95'
                            }`}
                          >
                            {user.is_banned ? 'Restore' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12">
               <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-lg">
                    <Activity className="text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic mb-2 text-white">Grid Health</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">System synchronization and database status</p>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-[94%] h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                  </div>
                  <div className="flex justify-between w-full mt-3">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic">Operational</span>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">94% Latency Optimized</span>
                  </div>
               </div>
               
               <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 shadow-lg">
                    <AlertTriangle className="text-red-500" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic mb-2 text-white">Protocol Disruption</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">Pending result disputes requiring root intervention</p>
                  <p className="text-5xl font-black text-white italic">0</p>
                  <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mt-4 italic">No conflicts detected</p>
               </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
               {logs.length === 0 ? (
                  <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl">
                     <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">No historical data found</p>
                  </div>
               ) : (
                 logs.map((log) => (
                   <div key={log.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-red-500/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-950 rounded-lg border border-white/5">
                          <Hash size={16} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase italic text-white">{log.action.replace('_', ' ')}</p>
                          <p className="text-[9px] text-slate-600 font-mono mt-1">Resource ID: {log.resource_id}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-700">{new Date(log.created_at).toLocaleTimeString()}</span>
                   </div>
                 ))
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: 'blue' | 'red' }) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    red: 'bg-red-500/10 border-red-500/20 text-red-500',
  };

  return (
    <div className={`p-6 bg-slate-900/50 border rounded-[2rem] min-w-[160px] ${colors[color].split(' ')[1]}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={14} className={colors[color].split(' ')[2]} />
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-3xl font-black italic leading-none">{value}</p>
    </div>
  );
}
