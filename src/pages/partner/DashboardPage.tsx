import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Bell,
  MessageSquare,
  PhoneCall,
  ArrowRight,
  Clock,
  ChevronRight,
  Loader2,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PartnerLayout } from '../../components/PartnerLayout';
import { StatusBadge } from '../../components/StatusBadge';
import {
  getPartnerStatus,
  getPartnerAnnouncements,
  getPartnerTickets,
} from '../../services/api';
import type { PartnerStatus, Announcement, SupportTicket } from '../../types';

export const DashboardPage: React.FC = () => {
  const { partner, user } = useAuth();

  const [status, setStatus] = useState<PartnerStatus | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!partner?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [statusData, annData, ticketData] = await Promise.all([
          getPartnerStatus(partner.id),
          getPartnerAnnouncements(partner.id),
          getPartnerTickets(partner.id),
        ]);

        if (isMounted) {
          setStatus(statusData);
          setAnnouncements(annData);
          setTickets(ticketData);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [partner?.id]);

  const unreadAnnouncementsCount = announcements.filter((a) => !a.is_read).length;
  const openTicketsCount = tickets.filter(
    (t) => t.status === 'Yeni' || t.status === 'İnceleniyor' || t.status === 'Yanıt bekleniyor'
  ).length;

  return (
    <PartnerLayout>
      <div className="space-y-8">
        {/* Top Greeting Header */}
        <div className="bg-[#121318] p-6 sm:p-8 rounded-2xl border border-zinc-800/80 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Hoş geldiniz, {partner?.display_name || partner?.username || user?.email || 'Partner'}!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
              Eternal Production Partner Portal hesabınızın anlık durumunu aşağıdan takip edebilirsiniz.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#0a0a0c] px-4 py-2 rounded-xl border border-zinc-800 text-xs text-zinc-400">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>
              Son Giriş: {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Summary Metric Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Account Status */}
            <Link
              to="/partner/status"
              className="bg-[#121318] p-5 rounded-xl border border-zinc-800/80 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Hesap Durumu
                </span>
                <div className="p-2 rounded-lg bg-zinc-900 text-purple-400 group-hover:bg-purple-950 transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <StatusBadge status={status?.status || 'Normal'} size="md" />
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors" />
              </div>
              <div className="mt-3 text-[11px] text-zinc-500 flex items-center gap-1">
                <span>Güncelleme:</span>
                <span className="text-zinc-400">
                  {status?.updated_at
                    ? new Date(status.updated_at).toLocaleDateString('tr-TR')
                    : 'Henüz güncellenmedi'}
                </span>
              </div>
            </Link>

            {/* Metric 2: Unread Announcements */}
            <Link
              to="/partner/announcements"
              className="bg-[#121318] p-5 rounded-xl border border-zinc-800/80 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Okunmamış Duyuru
                </span>
                <div className="p-2 rounded-lg bg-zinc-900 text-amber-400 group-hover:bg-amber-950 transition-colors">
                  <Bell className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{unreadAnnouncementsCount}</span>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors" />
              </div>
              <div className="mt-2 text-[11px] text-zinc-500">
                Toplam {announcements.length} duyurudan
              </div>
            </Link>

            {/* Metric 3: Open Support Tickets */}
            <Link
              to="/partner/support"
              className="bg-[#121318] p-5 rounded-xl border border-zinc-800/80 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Açık Destek Talebi
                </span>
                <div className="p-2 rounded-lg bg-zinc-900 text-blue-400 group-hover:bg-blue-950 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{openTicketsCount}</span>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors" />
              </div>
              <div className="mt-2 text-[11px] text-zinc-500">
                Toplam {tickets.length} talebiniz bulunmaktadır
              </div>
            </Link>

            {/* Metric 4: Contact & Help */}
            <Link
              to="/partner/contact"
              className="bg-[#121318] p-5 rounded-xl border border-zinc-800/80 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  İletişim & Destek
                </span>
                <div className="p-2 rounded-lg bg-zinc-900 text-emerald-400 group-hover:bg-emerald-950 transition-colors">
                  <PhoneCall className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-200">Ajans Yetkilileri</span>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors" />
              </div>
              <div className="mt-3 text-[11px] text-zinc-500">
                Açık destek saatleri ve sosyal medya
              </div>
            </Link>
          </div>
        )}

        {/* Quick Access Menu */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Hızlı Erişim
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/partner/status"
              className="bg-[#121318] hover:bg-zinc-800/80 p-4 rounded-xl border border-zinc-800 text-center transition-colors flex flex-col items-center gap-2"
            >
              <ShieldCheck className="w-6 h-6 text-purple-400" />
              <span className="text-xs font-semibold text-zinc-200">Hesap Durumum</span>
            </Link>

            <Link
              to="/partner/announcements"
              className="bg-[#121318] hover:bg-zinc-800/80 p-4 rounded-xl border border-zinc-800 text-center transition-colors flex flex-col items-center gap-2"
            >
              <Bell className="w-6 h-6 text-amber-400" />
              <span className="text-xs font-semibold text-zinc-200">Duyurular</span>
            </Link>

            <Link
              to="/partner/support/new"
              className="bg-[#121318] hover:bg-zinc-800/80 p-4 rounded-xl border border-zinc-800 text-center transition-colors flex flex-col items-center gap-2"
            >
              <MessageSquare className="w-6 h-6 text-blue-400" />
              <span className="text-xs font-semibold text-zinc-200">Destek Talebi Aç</span>
            </Link>

            <Link
              to="/partner/contact"
              className="bg-[#121318] hover:bg-zinc-800/80 p-4 rounded-xl border border-zinc-800 text-center transition-colors flex flex-col items-center gap-2"
            >
              <PhoneCall className="w-6 h-6 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-200">İletişim Bilgileri</span>
            </Link>
          </div>
        </div>

        {/* Recent Announcements & Tickets Twin Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Announcements */}
          <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">Son Duyurular</h3>
              </div>
              <Link
                to="/partner/announcements"
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
              >
                Tümünü Gör
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {announcements.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-zinc-700" />
                <span>Henüz yayınlanmış bir duyuru bulunmamaktadır.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 3).map((ann) => (
                  <Link
                    key={ann.id}
                    to={`/partner/announcements/${ann.id}`}
                    className="block p-3.5 rounded-xl bg-[#0a0a0c] border border-zinc-800/80 hover:border-purple-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-medium">
                        {ann.category}
                      </span>
                      <span>
                        {ann.published_at
                          ? new Date(ann.published_at).toLocaleDateString('tr-TR')
                          : 'Tarih yok'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-zinc-100 line-clamp-1">
                      {ann.title}
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                      {ann.content}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Support Tickets */}
          <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <h3 className="text-base font-bold text-white">Son Destek Talepleri</h3>
              </div>
              <Link
                to="/partner/support"
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
              >
                Tümünü Gör
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {tickets.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
                <HelpCircle className="w-8 h-8 text-zinc-700" />
                <span>Henüz oluşturulmuş destek talebiniz yok.</span>
                <Link
                  to="/partner/support/new"
                  className="mt-2 text-xs font-semibold text-purple-400 hover:text-purple-300"
                >
                  + Yeni Talep Oluştur
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.slice(0, 3).map((t) => (
                  <Link
                    key={t.id}
                    to={`/partner/support/${t.id}`}
                    className="block p-3.5 rounded-xl bg-[#0a0a0c] border border-zinc-800/80 hover:border-purple-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono text-zinc-400 text-[11px] font-semibold">
                        {t.ticket_number}
                      </span>
                      <StatusBadge status={t.status} size="sm" />
                    </div>
                    <div className="text-sm font-semibold text-zinc-100 line-clamp-1">
                      {t.subject}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>{t.category}</span>
                      <span>{new Date(t.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PartnerLayout>
  );
};
