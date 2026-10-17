import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, AlertCircle, Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { loginWithUsername, isDbConnected } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password) {
      setErrorMessage('Lütfen kullanıcı adı ve şifrenizi girin.');
      return;
    }

    if (!isDbConnected) {
      setErrorMessage(
        'Veritabanı bağlantısı yapılandırılmamıştır. Lütfen .env dosyasında VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY anahtarlarını ayarlayın.'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await loginWithUsername(username, password);
      if (res.success) {
        navigate('/partner/dashboard');
      } else {
        setErrorMessage(res.error || 'Giriş yapılamadı. Kullanıcı adı veya şifre hatalı.');
      }
    } catch {
      setErrorMessage('Giriş yapılırken beklenmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-8 bg-[#121318] p-6 sm:p-8 rounded-2xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
        {/* Top subtle glow background accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-900 to-zinc-900 border border-purple-500/40 shadow-lg text-white font-black text-2xl tracking-tighter">
            EP
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            ETERNAL PRODUCTION
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium">
            Partner Portal Giriş Paneli
          </p>
        </div>

        {/* DB Connection Alert if not set up */}
        {!isDbConnected && (
          <div className="p-3.5 bg-amber-950/70 border border-amber-800/80 rounded-xl text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Veritabanı Yapılandırılmadı</p>
              <p className="mt-0.5">
                Canlı Supabase veritabanı bağlantısı yok. Giriş yapmak için .env ortam değişkenlerinizi tanımlayın.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Kullanıcı Adı
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Örn: partner_kullanici"
                className="w-full pl-10 pr-4 py-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Şifre
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 focus:outline-hidden"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Giriş Yapılıyor...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Giriş Yap</span>
              </>
            )}
          </button>
        </form>

        {/* First time activation note */}
        <div className="pt-4 border-t border-zinc-800/80 text-center space-y-2">
          <p className="text-xs text-zinc-500">
            Davet bağlantısı aldınız ve ilk şifrenizi belirlemek mi istiyorsunuz?
          </p>
          <Link
            to="/partner/invite"
            className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Davet Bağlantısı ile Şifre Belirle</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
