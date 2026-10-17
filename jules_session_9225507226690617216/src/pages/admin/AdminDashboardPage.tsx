import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Bell,
  MessageSquare,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  Loader2,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import {
  getAllPartners,
  getAllAnnouncementsAdmin,
  getAllTicketsAdmin,
  getAuditLogsAdmin,
} from '../../services/api';
import type { Partner, SupportTicket, Announcement, AuditLog } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadMetrics = async () => {
      setLoading(true);
      try {
        const [partnerData, annData, ticketData, logData] = await Promise.all([
          getAllPartners(),
          getAllAnnouncementsAdmin(),
          getAllTicketsAdmin(),
          getAuditLogsAdmin(),
        ]);

        if (isMounted) {
          setPartners(partnerData);
          setAnnouncements(annData);
          setTickets(ticketData);
          setAuditLogs(logData);
        }
      } catch (err) {
        console.error('Error loading admin dashboard metrics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalPartners = partners.length;
  const activePartners = partners.filter((p) => p.is_active).length;
  const openTickets = tickets.filter((t) => t.status !== 'Çözüldü' && t.status !== 'Kapatıldı').length;
  const publishedAnnouncements = announcements.filter((a) => a.publication_status === 'Yayında').length;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
              Yönetici Kontrol Paneli
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
              Eternal Production Partner Portal sistem metrikleri ve yönetim modülleri.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/partners"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Partner Ekle</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/admin/partners"
                className="bg-[#121318] p-5 rounded-xl border border-zinc-800/80 hover:border-purple-500/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Kayıtlı Partnerler
                  </span>
                  <div className="p-2 rounded-lg bg-purple-950 text-purple-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">{totalPartners}</span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    {activePartners} Aktif
                  </span>
                </div>
              </Link>

              <Link
                to="/admin/support"
                className="bg-[#121318] p-5 rounded-xl border border-zinc-800/80 hover:border-purple-500/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Açık Destek Talepleri
                  </span>
                  <div className="p-2 rounded-lg bg-blue-950 text-blue-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">{openTickets}</span>
                  <span className="text-xs text-zinc-400">Toplam {tickets.length}</span>
                </div>
              </Link>

              <Link
                to="/admin/announcements"
                className="bg-[#121318] p-5 rounded-xl border border-zinc-800/80 hover:border-purple-500/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Yayınlanan Duyurular
                  </span>
                  <div className="p-2 rounded-lg bg-amber-950 text-amber-400">
                    <Bell className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">{publishedAnnouncements}</span>
                  <span className="text-xs text-zinc-400">Toplam {announcements.length}</span>
                </div>
              </Link>

              <Link
                to="/admin/audit-logs"
                className="bg-[#121318] p-5 rounded-xl border border-zinc-800/80 hover:border-purple-500/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Son İşlem Kayıtları
                  </span>
                  <div className="p-2 rounded-lg bg-zinc-900 text-zinc-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">{auditLogs.length}</span>
                  <span className="text-xs text-purple-400 font-semibold flex items-center gap-1">
                    Detay Gör
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-6 space-y-4">
                <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-3">
                  Hızlı Yönetim İşlemleri
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    to="/admin/partners"
                    className="p-4 rounded-xl bg-[#0a0a0c] border border-zinc-800 hover:border-purple-500/50 transition-colors flex items-center gap-3"
                  >
                    <Users className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Partner Yönetimi</div>
                      <div className="text-[10px] text-zinc-500">Partner ekle, davet et, statü değiştir</div>
                    </div>
                  </Link>

                  <Link
                    to="/admin/announcements"
                    className="p-4 rounded-xl bg-[#0a0a0c] border border-zinc-800 hover:border-purple-500/50 transition-colors flex items-center gap-3"
                  >
                    <Bell className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Duyuru Oluştur</div>
                      <div className="text-[10px] text-zinc-500">Duyuru yayınla ve kitle hedefle</div>
                    </div>
                  </Link>

                  <Link
                    to="/admin/support"
                    className="p-4 rounded-xl bg-[#0a0a0c] border border-zinc-800 hover:border-purple-500/50 transition-colors flex items-center gap-3"
                  >
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Destek Talepleri</div>
                      <div className="text-[10px] text-zinc-500">Yanıtla, durum güncelle, iç not ekle</div>
                    </div>
                  </Link>

                  <Link
                    to="/admin/settings"
                    className="p-4 rounded-xl bg-[#0a0a0c] border border-zinc-800 hover:border-purple-500/50 transition-colors flex items-center gap-3"
                  >
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-white">İletişim & Ayarlar</div>
                      <div className="text-[10px] text-zinc-500">Genel sistem ve iletişim bilgilerini düzenle</div>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-white">Son Denetim Kayıtları</h3>
                  <Link
                    to="/admin/audit-logs"
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Tümünü Gör
                  </Link>
                </div>

                {auditLogs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500">
                    Henüz kayıtlı işlem geçmişi bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {auditLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-[#0a0a0c] rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-purple-400">{log.action}</span>
                          <span className="text-zinc-500 ml-2">({log.entity_type})</span>
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(log.created_at).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};
