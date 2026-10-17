import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const InvitePage: React.FC = () => {
  const { claimInviteAndSetPassword, isDbConnected } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!token.trim()) {
      setErrorMessage('Geçerli bir davet kodu veya bağlantısı gereklidir.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Şifreniz en az 8 karakter uzunluğunda olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Girilen şifreler birbiriyle eşleşmiyor.');
      return;
    }

    if (!isDbConnected) {
      setErrorMessage('Veritabanı bağlantısı yapılandırılmamıştır.');
      return;
    }

    setLoading(true);

    try {
      const res = await claimInviteAndSetPassword(token.trim(), password);
      if (res.success) {
        setSuccessMessage('İlk şifreniz başarıyla belirlendi ve hesabınız aktifleştirildi!');
        setTimeout(() => {
          navigate('/partner/dashboard');
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Davet bağlantısı doğrulanamadı.');
      }
    } catch {
      setErrorMessage('İşlem sırasında beklenmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-8 bg-[#121318] p-6 sm:p-8 rounded-2xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-900 to-zinc-900 border border-purple-500/40 shadow-lg text-purple-300">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            İlk Şifre Oluşturma
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium">
            Eternal Production partner davetinizi onaylayın ve güvenli şifrenizi belirleyin.
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invite Token Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Davet Kodu / Token
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Davet kodunuzu yapıştırın"
              className="w-full px-4 py-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-hidden focus:border-purple-500"
            />
          </div>

          {/* New Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Yeni Şifre
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 8 karakter"
                className="w-full px-4 py-2.5 pr-11 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-hidden focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Şifre Tekrar
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Şifrenizi tekrar girin"
              className="w-full px-4 py-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-hidden focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Onaylanıyor...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Şifreyi Kaydet ve Giriş Yap</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-800/80 text-center">
          <Link
            to="/partner/login"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Giriş Ekranına Dön</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
