import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, role: 'competitor' | 'organizer') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load user profile');
      return null;
    }

    return data;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
          // If profile missing or missing common fields, offer to import from OAuth provider metadata
          try {
            const metadata = (session.user.user_metadata as Record<string, any>) ?? {};
            const suggestedUsername = metadata.name || metadata.preferred_username || metadata.username || null;
            const suggestedAvatar = metadata.avatar_url || metadata.picture || null;

            if (profileData == null && suggestedUsername) {
              // Try to create profile, handle username collisions gracefully
              let finalUsername = suggestedUsername;
              try {
                const { error: insertError } = await supabase.from('user_profiles').upsert({ 
                  id: session.user.id, 
                  username: finalUsername, 
                  avatar_url: suggestedAvatar 
                }, { onConflict: 'id' });

                // If duplicate username error (23505), try once more with a random suffix
                if (insertError && (insertError as any).code === '23505') {
                  finalUsername = `${suggestedUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
                  await supabase.from('user_profiles').upsert({ 
                    id: session.user.id, 
                    username: finalUsername, 
                    avatar_url: suggestedAvatar 
                  }, { onConflict: 'id' }).throwOnError();
                } else if (insertError) {
                  throw insertError;
                }
              } catch (upsertErr) {
                console.warn('Silent profile creation failed:', upsertErr);
              }
              
              const newProfile = await fetchProfile(session.user.id);
              setProfile(newProfile);
            } else if (profileData && ( !profileData.avatar_url && suggestedAvatar )) {
              // ask user to confirm replacing avatar (simple confirm for now)
              if (typeof window !== 'undefined') {
                const ok = window.confirm('We detected an avatar from your OAuth provider. Do you want to use this avatar on your profile?');
                if (ok) {
                  await supabase.from('user_profiles').update({ avatar_url: suggestedAvatar }).eq('id', session.user.id);
                  const updated = await fetchProfile(session.user.id);
                  setProfile(updated);
                }
              }
            }
          } catch (err) {
            // ignore non-critical import errors
            console.warn('OAuth profile import skipped:', err);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, role: 'competitor' | 'organizer') => {
    // 1. Check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    
    if (checkError) throw checkError;
    if (existingUser) {
      throw new Error('Username is already taken. Please choose another one.');
    }

    // 2. Perform Auth SignUp
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          role,
        },
      },
    });

    if (error) throw error;

    // 3. Create Profile
    // If the user is immediately signed in (no email confirmation required),
    // create the profile now. 
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          username,
          role,
        });

      if (profileError) {
        // If profile creation fails, we have an auth user without a profile.
        // We should inform the user.
        console.error('Profile creation failed:', profileError);
        throw new Error('Account created but profile setup failed: ' + (profileError.message || 'Unknown error'));
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn('useAuth used outside AuthProvider — returning safe defaults');
    return {
      user: null,
      profile: null,
      loading: false,
      signUp: async () => {},
      signIn: async () => {},
      signOut: async () => {},
      refreshProfile: async () => {},
    } as AuthContextType;
  }
  return context;
}
