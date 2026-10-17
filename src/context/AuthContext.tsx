import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserRole, Partner } from '../types';
import { getPartnerProfile } from '../services/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  partner: Partner | null;
  isLoading: boolean;
  isDbConnected: boolean;
  loginWithUsername: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  claimInviteAndSetPassword: (
    token: string,
    password: string
  ) => Promise<{ success: boolean; username?: string; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isDbConnected = isSupabaseConfigured();

  const fetchRoleAndPartner = useCallback(async (authUser: User) => {
    if (!isDbConnected) return;

    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .maybeSingle();

      const userRole: UserRole = roleData?.role || 'partner';
      setRole(userRole);

      if (userRole === 'partner') {
        const partnerProfile = await getPartnerProfile(authUser.id);
        setPartner(partnerProfile);
      } else {
        setPartner(null);
      }
    } catch (err) {
      console.error('Error loading user role/profile:', err);
    }
  }, [isDbConnected]);

  useEffect(() => {
    if (!isDbConnected) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);

      if (initialSession?.user) {
        fetchRoleAndPartner(initialSession.user).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);

      if (currentSession?.user) {
        await fetchRoleAndPartner(currentSession.user);
      } else {
        setRole(null);
        setPartner(null);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isDbConnected, fetchRoleAndPartner]);

  const loginWithEmail = async (email: string, pass: string) => {
    if (!isDbConnected) {
      return { success: false, error: 'Veritabanı bağlantısı yapılandırılmamış.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error || !data.user) {
        return { success: false, error: 'Giriş bilgileri hatalı veya hesap bulunamadı.' };
      }

      await fetchRoleAndPartner(data.user);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Giriş sırasında beklenmeyen bir hata oluştu.';
      return { success: false, error: msg };
    }
  };

  const loginWithUsername = async (username: string, pass: string) => {
    if (!isDbConnected) {
      return { success: false, error: 'Veritabanı bağlantısı yapılandırılmamış.' };
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      return { success: false, error: 'Lütfen geçerli bir kullanıcı adı girin.' };
    }

    try {
      let authEmail = '';
      let isActive = true;

      const { data: rpcData, error: rpcError } = await supabase.rpc('get_partner_auth_email_by_username', {
        p_username: cleanUsername,
      });

      if (!rpcError && rpcData && rpcData.length > 0) {
        authEmail = rpcData[0].email;
        isActive = rpcData[0].is_active;
      } else {
        authEmail = `${cleanUsername}@partner.eternal.internal`;
      }

      if (!isActive) {
        return { success: false, error: 'Hesabınız pasif duruma getirilmiştir. Lütfen ajans ile iletişime geçin.' };
      }

      if (!authEmail && cleanUsername.includes('@')) {
        authEmail = cleanUsername;
      }

      const res = await loginWithEmail(authEmail, pass);
      if (!res.success && !cleanUsername.includes('@')) {
        const retryRes = await loginWithEmail(`${cleanUsername}@partner.eternal.internal`, pass);
        if (retryRes.success) return retryRes;
      }

      return res;
    } catch {
      return { success: false, error: 'Kullanıcı adı doğrulanırken bir hata oluştu.' };
    }
  };

  const claimInviteAndSetPassword = async (token: string, pass: string) => {
    if (!isDbConnected) {
      return { success: false, error: 'Veritabanı bağlantısı yapılandırılmamış.' };
    }

    try {
      const { data: partnerData, error: partnerErr } = await supabase
        .from('partners')
        .select('*')
        .eq('invite_token', token)
        .maybeSingle();

      if (partnerErr || !partnerData) {
        return { success: false, error: 'Geçersiz veya kullanılmış davet bağlantısı.' };
      }

      if (partnerData.invite_expires_at && new Date(partnerData.invite_expires_at) < new Date()) {
        return { success: false, error: 'Davet bağlantısının süresi dolmuş.' };
      }

      const shadowEmail = `${partnerData.username.toLowerCase()}@partner.eternal.internal`;

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: shadowEmail,
        password: pass,
        options: {
          data: {
            username: partnerData.username,
            display_name: partnerData.display_name,
          },
        },
      });

      if (signUpErr || !signUpData.user) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: shadowEmail,
          password: pass,
        });

        if (signInErr || !signInData.user) {
          return { success: false, error: signUpErr?.message || 'Hesap oluşturulurken hata oluştu.' };
        }
      }

      const newAuthUserId = signUpData.user?.id || (await supabase.auth.getUser()).data.user?.id;

      if (!newAuthUserId) {
        return { success: false, error: 'Kullanıcı kimliği alınamadı.' };
      }

      await supabase
        .from('partners')
        .update({
          auth_user_id: newAuthUserId,
          invite_token: null,
          invite_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', partnerData.id);

      await supabase.from('user_roles').upsert({
        user_id: newAuthUserId,
        role: 'partner',
      });

      await loginWithEmail(shadowEmail, pass);

      return { success: true, username: partnerData.username };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Davet kabul edilirken hata oluştu.';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    if (isDbConnected) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setRole(null);
    setPartner(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchRoleAndPartner(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        partner,
        isLoading,
        isDbConnected,
        loginWithUsername,
        loginWithEmail,
        claimInviteAndSetPassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
