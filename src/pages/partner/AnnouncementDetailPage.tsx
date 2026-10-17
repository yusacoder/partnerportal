import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PartnerLayout } from '../../components/PartnerLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { getPartnerAnnouncements, markAnnouncementAsRead } from '../../services/api';
import type { Announcement } from '../../types';

export const AnnouncementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { partner } = useAuth();
  const navigate = useNavigate();

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadAnnouncement = async () => {
      if (!id || !partner?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const allAnnouncements = await getPartnerAnnouncements(partner.id);
        const found = allAnnouncements.find((a: Announcement) => a.id === id);

        if (isMounted) {
          setAnnouncement(found || null);
          if (found && !found.is_read) {
            await markAnnouncementAsRead(found.id, partner.id);
          }
        }
      } catch (err) {
        console.error('Error loading announcement detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAnnouncement();

    return () => {
      isMounted = false;
    };
  }, [id, partner?.id]);

  return (
    <PartnerLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to="/partner/announcements"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tüm Duyurulara Dön</span>
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : !announcement ? (
          <div className="bg-[#121318] p-12 rounded-2xl border border-zinc-800 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-white">Duyuru Bulunamadı</h2>
            <p className="text-xs text-zinc-400">
              İstediğiniz duyuru kaldırılmış, arşivlenmiş veya erişim yetkiniz bulunmuyor olabilir.
            </p>
            <button
              onClick={() => navigate('/partner/announcements')}
              className="mt-2 px-4 py-2 bg-purple-900 text-purple-200 text-xs font-bold rounded-xl"
            >
              Duyurulara Dön
            </button>
          </div>
        ) : (
          <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="space-y-3 border-b border-zinc-800 pb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-purple-950 border border-purple-800 text-purple-300">
                  {announcement.category}
                </span>
                <StatusBadge status={announcement.priority} size="sm" />
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 ml-auto">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Okundu
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {announcement.title}
              </h1>

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>
                  Yayın Tarihi:{' '}
                  {announcement.published_at
                    ? new Date(announcement.published_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Tarih bilgisi yok'}
                </span>
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
              {announcement.content}
            </div>
          </div>
        )}
      </div>
    </PartnerLayout>
  );
};
