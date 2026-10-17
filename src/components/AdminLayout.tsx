import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  Bell,
  MessageSquare,
  Settings,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  LayoutDashboard,
  ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/partner/login');
  };

  const navItems = [
    { label: 'Özet Paneli', path: '/admin', icon: LayoutDashboard },
    { label: 'Partner Yönetimi', path: '/admin/partners', icon: Users },
    { label: 'Duyuru Yönetimi', path: '/admin/announcements', icon: Bell },
    { label: 'Destek & Şikâyetler', path: '/admin/support', icon: MessageSquare },
    { label: 'Sistem Ayarları', path: '/admin/settings', icon: Settings },
    { label: 'Denetim Kayıtları', path: '/admin/audit-logs', icon: FileSpreadsheet },
  ];

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#121318] p-8 rounded-2xl border border-rose-800/80 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-rose-950 border border-rose-800 rounded-full flex items-center justify-center text-rose-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Erişim Engellendi</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Yönetici paneline erişim yetkiniz bulunmamaktadır. Bu alana yalnızca yetkili ajans yöneticileri giriş yapabilir.
          </p>
          <div className="pt-2">
            <Link
              to="/partner/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Partner Paneline Dön</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-[#0f1015]/90 backdrop-blur-md border-b border-purple-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/admin" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-900 to-rose-950 border border-purple-500/40 flex items-center justify-center font-extrabold text-white text-base tracking-tighter shadow-sm">
                EP
              </div>
              <div>
                <div className="font-bold tracking-tight text-white text-sm sm:text-base flex items-center gap-2">
                  <span>ETERNAL PRODUCTION</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-extrabold uppercase">
                    Yönetici
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase">
                  Yönetim & Denetim Paneli
                </div>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-purple-900/60 text-purple-200 border border-purple-700/60 shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/partner/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-semibold transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Partner Portalına Geç</span>
              </Link>

              <button
                onClick={handleLogout}
                title="Oturumu Kapat"
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      <footer className="border-t border-zinc-900 bg-[#070709] py-4 text-center text-xs text-zinc-500">
        Eternal Production Administrative Management & Command Center
      </footer>
    </div>
  );
};
