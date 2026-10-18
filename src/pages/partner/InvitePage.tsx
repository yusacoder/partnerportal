import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';

export const InvitePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-6 bg-[#121318] p-6 sm:p-8 rounded-2xl border border-zinc-800/80 shadow-2xl relative overflow-hidden text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-900 to-zinc-900 border border-purple-500/40 shadow-lg text-purple-300 mx-auto">
          <KeyRound className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          Doğrudan Giriş Sistemi
        </h1>

        <div className="p-4 bg-purple-950/60 border border-purple-800/60 rounded-xl text-xs text-purple-200 space-y-2 text-left">
          <p className="font-semibold text-purple-300">Sistem Güncellemesi Bilgilendirmesi:</p>
          <p>
            Partner portalımızda davet bağlantısı sistemi kaldırılmıştır. Kullanıcı hesapları artık doğrudan ajans yöneticisi tarafından tanımlanmaktadır.
          </p>
          <p>
            Tarafınıza iletilen **Kullanıcı Adı** ve **Başlangıç Şifresi** ile giriş ekranından doğrudan oturum açabilirsiniz.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/partner/login"
            className="w-full py-3 px-4 bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm rounded-xl transition-colors shadow-lg inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Giriş Ekranına Git</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
