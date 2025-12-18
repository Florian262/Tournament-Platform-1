import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';
import Skeleton from './Skeleton';
import toast from 'react-hot-toast';

interface PlayerSearchProps {
  onNavigate: (page: string, data?: unknown) => void;
}

function looksLikeUUID(input: string) {
  // basic check for UUID-like pattern (starts with hex and contains dashes or length)
  const uuidRegex = /^[0-9a-fA-F-]{6,}$/;
  return uuidRegex.test(input);
}

export default function PlayerSearch({ onNavigate }: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const runSearch = async (q: string) => {
    const term = q.trim();
    if (!term) return setResults([]);
    setLoading(true);
    try {
      if (looksLikeUUID(term)) {
        const { data, error } = await supabase.from('user_profiles').select('id, username, avatar_url').eq('id', term).maybeSingle();
        if (error) throw error;
        setResults(data ? [data] : []);
      } else {
        const { data, error } = await supabase.from('user_profiles').select('id, username, avatar_url').ilike('username', `%${term}%`).limit(20);
        if (error) throw error;
        setResults(data || []);
      }
    } catch (err: any) {
      console.error('Search error', err);
      toast.error(err?.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch(debounced);
  }, [debounced]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Search /> Find Players</h2>

        <div className="mb-6 flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by username or ID" className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white" />
          <button onClick={() => runSearch(query)} className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Search</button>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-lg border border-blue-500/20">
          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No results</div>
          ) : (
            <div className="space-y-2">
              {results.map(r => (
                <button key={r.id} onClick={() => onNavigate('player-profile', r.id)} className="w-full text-left flex items-center gap-3 p-3 rounded hover:bg-slate-800/60">
                  <Avatar src={r.avatar_url} username={r.username} size={40} />
                  <div className="flex-1">
                    <div className="font-semibold text-white">{r.username || '(no username)'}</div>
                    <div className="text-sm text-slate-400">{r.id}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
