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
  loginWithUsername: (username: string, pass: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
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

  const fetchRoleAndPartner = useCallback(async (authUser: User): Promise<UserRole> => {
    if (!isDbConnected) return 'partner';

    try {
      // 1. Check app_metadata (trusted server-side auth metadata, cannot be edited by client)
      const isAppAdmin = authUser.app_metadata?.role === 'admin';

      // 2. Check user_roles table (protected by RLS)
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .maybeSingle();

      const isDbAdmin = roleData?.role === 'admin';

      // Assign admin if either app_metadata or protected user_roles grants admin
      const userRole: UserRole = (isAppAdmin || isDbAdmin) ? 'admin' : (roleData?.role as UserRole || 'partner');
      setRole(userRole);

      if (userRole === 'partner') {
        const partnerProfile = await getPartnerProfile(authUser.id);
        setPartner(partnerProfile);
      } else {
        setPartner(null);
      }

      return userRole;
    } catch (err) {
      console.error('Error loading user role/profile:', err);
      const fallbackRole: UserRole = authUser.app_metadata?.role === 'admin' ? 'admin' : 'partner';
      setRole(fallbackRole);
      return fallbackRole;
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

  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
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

      const userRole = await fetchRoleAndPartner(data.user);
      return { success: true, role: userRole };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Giriş sırasında beklenmeyen bir hata oluştu.';
      return { success: false, error: msg };
    }
  };

  const loginWithUsername = async (username: string, pass: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    if (!isDbConnected) {
      return { success: false, error: 'Veritabanı bağlantısı yapılandırılmamış.' };
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      return { success: false, error: 'Lütfen geçerli bir kullanıcı adı girin.' };
    }

    // Direct email authentication if user provided an email address (e.g. admin logins)
    if (cleanUsername.includes('@')) {
      return await loginWithEmail(cleanUsername, pass);
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

      return await loginWithEmail(authEmail, pass);
    } catch {
      return { success: false, error: 'Kullanıcı adı doğrulanırken bir hata oluştu.' };
    }
  };

  const claimInviteAndSetPassword = async (token: string, pass: string) => {
    if (!isDbConnected) {
      return { success: false, error: 'Veritabanı bağlantısı yapılandırılmamış.' };
    }

    const cleanToken = token ? token.trim() : '';
    if (!cleanToken) {
      return { success: false, error: 'Geçerli bir davet kodu veya bağlantısı gereklidir.' };
    }

    if (!pass || pass.length < 8) {
      return { success: false, error: 'Şifreniz en az 8 karakter uzunluğunda olmalıdır.' };
    }

    try {
      // 1. Fetch partner record by invite token using SECURITY DEFINER RPC
      const { data: rpcPartnerData, error: rpcPartnerErr } = await supabase.rpc('get_partner_by_invite_token', {
        p_token: cleanToken,
      });

      let partnerData = Array.isArray(rpcPartnerData) && rpcPartnerData.length > 0 ? rpcPartnerData[0] : null;

      // Fallback query if RPC didn't return data or error occurred
      if (!partnerData && !rpcPartnerErr) {
        const { data: directData } = await supabase
          .from('partners')
          .select('*')
          .eq('invite_token', cleanToken)
          .maybeSingle();

        if (directData) {
          partnerData = directData;
        }
      }

      if (!partnerData) {
        return { success: false, error: 'Geçersiz veya kullanılmış davet bağlantısı.' };
      }

      if (partnerData.auth_user_id) {
        return { success: false, error: 'Bu davet bağlantısı daha önce kullanılmış.' };
      }

      if (!partnerData.is_active) {
        return { success: false, error: 'Hesabınız pasif duruma getirilmiştir. Lütfen ajans ile iletişime geçin.' };
      }

      if (partnerData.invite_expires_at && new Date(partnerData.invite_expires_at) <= new Date()) {
        return { success: false, error: 'Davet bağlantısının süresi dolmuş.' };
      }

      const shadowEmail = `${partnerData.username.toLowerCase()}@partner.eternal.internal`;

      // 2. Create Auth User
      let newAuthUserId: string | null = null;

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

      if (signUpData?.user?.id) {
        newAuthUserId = signUpData.user.id;
      }

      // If sign up failed because user exists, attempt sign in to recover existing auth_user_id
      if (signUpErr || !newAuthUserId) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: shadowEmail,
          password: pass,
        });

        if (signInData?.user?.id) {
          newAuthUserId = signInData.user.id;
        } else {
          return {
            success: false,
            error: signUpErr?.message || signInErr?.message || 'Hesap oluşturulurken hata oluştu.',
          };
        }
      }

      if (!newAuthUserId) {
        return { success: false, error: 'Kullanıcı kimliği alınamadı.' };
      }

      // 3. Atomically claim invite using RPC
      const { error: claimRpcErr } = await supabase.rpc('claim_partner_invite', {
        p_token: cleanToken,
        p_auth_user_id: newAuthUserId,
      });

      if (claimRpcErr) {
        // Fallback update if RPC failed
        const { error: updateErr } = await supabase
          .from('partners')
          .update({
            auth_user_id: newAuthUserId,
            invite_token: null,
            invite_expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', partnerData.id);

        if (updateErr) {
          return { success: false, error: claimRpcErr.message || 'Davet onaylanırken hata oluştu.' };
        }

        await supabase.from('user_roles').upsert({
          user_id: newAuthUserId,
          role: 'partner',
        });
      }

      // 4. Log in the newly activated partner
      const loginRes = await loginWithEmail(shadowEmail, pass);
      if (!loginRes.success) {
        return {
          success: true,
          username: partnerData.username,
        };
      }

      return { success: true, username: partnerData.username };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Davet kabul edilirken beklenmeyen bir hata oluştu.';
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
