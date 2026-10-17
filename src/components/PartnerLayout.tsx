import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Bell,
  MessageSquare,
  PhoneCall,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  User,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PartnerLayoutProps {
  children: React.ReactNode;
}

export const PartnerLayout: React.FC<PartnerLayoutProps> = ({ children }) => {
  const { partner, user, logout, isDbConnected, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/partner/login');
  };

  const navItems = [
    { label: 'Ana Sayfa', path: '/partner/dashboard', icon: LayoutDashboard },
    { label: 'Hesap Durumum', path: '/partner/status', icon: ShieldCheck },
    { label: 'Duyurular', path: '/partner/announcements', icon: Bell },
    { label: 'Şikâyet ve Destek', path: '/partner/support', icon: MessageSquare },
    { label: 'İletişim', path: '/partner/contact', icon: PhoneCall },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans">
      {/* DB Connection Warning Banner */}
      {!isDbConnected && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 text-amber-200 px-4 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 font-medium text-center">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Veritabanı bağlantısı kurulmamıştır. Gerçek Supabase kimlik bilgileri olmadan bu paneli tamamen kullanamazsınız.
          </span>
        </div>
      )}

      {/* Main Top Header */}
      <header className="sticky top-0 z-40 bg-[#0f1015]/90 backdrop-blur-md border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <Link to="/partner/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-900 to-zinc-900 border border-purple-500/30 flex items-center justify-center font-extrabold text-white text-base tracking-tighter shadow-sm group-hover:border-purple-500/60 transition-colors">
                EP
              </div>
              <div>
                <div className="font-bold tracking-tight text-white text-sm sm:text-base group-hover:text-purple-300 transition-colors">
                  ETERNAL PRODUCTION
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-400 font-medium tracking-wide uppercase">
                  Partner Portal
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-purple-950/50 text-purple-300 border border-purple-800/50 shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Profile & Actions */}
            <div className="hidden md:flex items-center gap-3 border-l border-zinc-800 pl-4">
              <div className="text-right">
                <div className="text-xs font-semibold text-zinc-200">
                  {partner?.display_name || partner?.username || user?.email || 'Partner'}
                </div>
                <div className="text-[10px] text-zinc-500">
                  @{partner?.username || 'partner'}
                </div>
              </div>

              {role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-2.5 py-1 rounded-md bg-purple-900/40 border border-purple-700/50 text-purple-300 hover:bg-purple-800/50 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Yönetici
                </Link>
              )}

              <button
                onClick={handleLogout}
                title="Oturumu Kapat"
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 focus:outline-hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-800 bg-[#0f1015] px-4 pt-2 pb-4 space-y-1">
            <div className="px-3 py-2 border-b border-zinc-800/80 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-zinc-200">
                  {partner?.display_name || partner?.username || 'Partner'}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">@{partner?.username || 'partner'}</span>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-purple-950/60 text-purple-300 border border-purple-800/60'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-300 bg-purple-950/40 border border-purple-800/50 mt-2"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Yönetici Paneline Geç</span>
              </Link>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/40 mt-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Oturumu Kapat</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#070709] py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            &copy; {new Date().getFullYear()} Eternal Production. Tüm hakları saklıdır.
          </div>
          <div className="flex items-center gap-4 text-zinc-500">
            <span>Saat Dilimi: Europe/Istanbul</span>
            <span>•</span>
            <Link to="/partner/contact" className="hover:text-zinc-300 transition-colors">
              Destek ve İletişim
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
