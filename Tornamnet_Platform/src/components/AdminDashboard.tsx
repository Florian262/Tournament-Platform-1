import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Shield, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile, AuditLog } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningUserId, setActioningUserId] = useState('');

  useEffect(() => {
    if (profile?.role !== 'admin') {
      onNavigate('home');
      return;
    }

    fetchData();
  }, [profile, activeTab]);

  const fetchData = async () => {
    setLoading(true);

    if (activeTab === 'users') {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setUsers(data);
    } else {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) setLogs(data);
    }

    setLoading(false);
  };

  const handleBanUser = async (userId: string) => {
    setActioningUserId(userId);

    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_banned: !user.is_banned,
          banned_at: !user.is_banned ? new Date().toISOString() : null,
          ban_reason: !user.is_banned ? 'Banned by administrator' : null,
        })
        .eq('id', userId);

      if (error) throw error;

      await supabase
        .from('audit_logs')
        .insert({
          action: user.is_banned ? 'user_unbanned' : 'user_banned',
          actor_id: profile!.id,
          subject_id: userId,
          resource_type: 'user',
          resource_id: userId,
          details: {},
        });

      fetchData();
    } catch (error: any) {
      console.error('Error banning user:', error);
      toast.error(error?.message || 'Failed to update user ban status');
    } finally {
      setActioningUserId('');
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'competitor' | 'organizer' | 'admin') => {
    setActioningUserId(userId);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await supabase
        .from('audit_logs')
        .insert({
          action: 'user_role_changed',
          actor_id: profile!.id,
          subject_id: userId,
          resource_type: 'user',
          resource_id: userId,
          details: { new_role: newRole },
        });

      fetchData();
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast.error(error?.message || 'Failed to change user role');
    } finally {
      setActioningUserId('');
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield size={36} className="text-red-500" />
            Admin Dashboard
          </h1>
          <p className="text-slate-400">System administration and user management</p>
        </div>

        <div className="flex gap-4 mb-6">
          {[
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'logs', label: 'Audit Logs', icon: LogOut },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'users' | 'logs')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/40'
                    : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50 border border-blue-500/20'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-slate-400 mt-4">Loading...</p>
            </div>
          ) : activeTab === 'users' ? (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Users ({users.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-4 px-4 text-slate-300 font-semibold">Username</th>
                      <th className="text-left py-4 px-4 text-slate-300 font-semibold">Role</th>
                      <th className="text-left py-4 px-4 text-slate-300 font-semibold">Status</th>
                      <th className="text-left py-4 px-4 text-slate-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-bold text-white">{user.username}</p>
                            <p className="text-xs text-slate-500">{user.id}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleChangeRole(user.id, e.target.value as 'competitor' | 'organizer' | 'admin')
                            }
                            disabled={actioningUserId === user.id}
                            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <option value="competitor">Competitor</option>
                            <option value="organizer">Organizer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.is_banned
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {user.is_banned ? '🚫 Banned' : '✓ Active'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleBanUser(user.id)}
                            disabled={actioningUserId === user.id}
                            className={`px-3 py-1 rounded text-sm font-semibold transition-colors disabled:opacity-50 ${
                              user.is_banned
                                ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                                : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                            }`}
                          >
                            {user.is_banned ? 'Unban' : 'Ban'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Audit Logs ({logs.length})
              </h2>

              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-white capitalize">
                          {log.action.replace('_', ' ')}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {log.resource_type} • {log.resource_id}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-2">
                      {log.actor_id && (
                        <p>Actor: {log.actor_id}</p>
                      )}
                      {log.subject_id && (
                        <p>Subject: {log.subject_id}</p>
                      )}
                    </div>

                    {Object.keys(log.details).length > 0 && (
                      <div className="text-xs text-slate-500 mt-2 bg-slate-900/50 p-2 rounded">
                        <code>{JSON.stringify(log.details)}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
