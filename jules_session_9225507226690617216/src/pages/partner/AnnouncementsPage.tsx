import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Filter, Search, Loader2, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PartnerLayout } from '../../components/PartnerLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { getPartnerAnnouncements } from '../../services/api';
import type { Announcement } from '../../types';

export const AnnouncementsPage: React.FC = () => {
  const { partner } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Hepsi');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'Hepsi',
    'Genel duyuru',
    'İş birliği',
    'Etkinlik',
    'Kampanya',
    'Sistem bakımı',
    'Önemli bilgilendirme',
  ];

  useEffect(() => {
    let isMounted = true;

    const loadAnnouncements = async () => {
      if (!partner?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getPartnerAnnouncements(partner.id);
        if (isMounted) setAnnouncements(data);
      } catch (err) {
        console.error('Error loading announcements:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, [partner?.id]);

  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesCategory = selectedCategory === 'Hepsi' || ann.category === selectedCategory;
    const matchesSearch =
      ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Bell className="w-6 h-6 text-amber-400" />
              Duyurular
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Eternal Production tarafından yayınlanan en güncel ajans duyuruları ve bilgilendirmeler.
            </p>
          </div>
        </div>

        <div className="bg-[#121318] p-4 rounded-xl border border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <Filter className="w-4 h-4 text-zinc-500 shrink-0 ml-1 mr-2 hidden sm:block" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-purple-950 text-purple-300 border border-purple-800/80'
                    : 'bg-[#0a0a0c] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Duyurularda ara..."
              className="w-full pl-9 pr-3 py-2 bg-[#0a0a0c] border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-purple-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-[#121318] p-12 rounded-2xl border border-zinc-800/80 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-400 font-medium">
              Kriterlerinize uygun yayınlanmış duyuru bulunamadı.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnnouncements.map((ann) => (
              <Link
                key={ann.id}
                to={`/partner/announcements/${ann.id}`}
                className={`block p-5 rounded-2xl border transition-all ${
                  ann.is_read
                    ? 'bg-[#121318] border-zinc-800/80 opacity-90 hover:border-zinc-700'
                    : 'bg-[#121318] border-purple-800/40 shadow-sm shadow-purple-950/20 hover:border-purple-500/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!ann.is_read && (
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-purple-900 text-purple-200 border border-purple-700 animate-pulse">
                        Yeni / Okunmadı
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {ann.category}
                    </span>
                    <StatusBadge status={ann.priority} size="sm" />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>
                      {ann.published_at
                        ? new Date(ann.published_at).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Tarih yok'}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight flex items-center justify-between group">
                  <span className="group-hover:text-purple-300 transition-colors">
                    {ann.title}
                  </span>
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-purple-400 transition-colors shrink-0 ml-2" />
                </h3>

                <p className="text-xs text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                  {ann.content}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PartnerLayout>
  );
};
