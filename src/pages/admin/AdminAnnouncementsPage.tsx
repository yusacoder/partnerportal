import React, { useEffect, useState } from 'react';
import {
  Bell,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { StatusBadge } from '../../components/StatusBadge';
import {
  getAllAnnouncementsAdmin,
  createAnnouncementAdmin,
  updateAnnouncementAdmin,
  getAllPartners,
} from '../../services/api';
import type {
  Announcement,
  AnnouncementCategory,
  AnnouncementPriority,
  PublicationStatus,
  Partner,
} from '../../types';

export const AdminAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('Genel duyuru');
  const [priority, setPriority] = useState<AnnouncementPriority>('Normal');
  const [pubStatus, setPubStatus] = useState<PublicationStatus>('Yayında');
  const [targetAudience, setTargetAudience] = useState<'all' | 'specific'>('all');
  const [targetPartnerIds, setTargetPartnerIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const categories: AnnouncementCategory[] = [
    'Genel duyuru',
    'İş birliği',
    'Etkinlik',
    'Kampanya',
    'Sistem bakımı',
    'Önemli bilgilendirme',
  ];

  const priorities: AnnouncementPriority[] = ['Düşük', 'Normal', 'Yüksek', 'Acil'];

  const loadData = async () => {
    setLoading(true);
    try {
      const [annData, partnerData] = await Promise.all([
        getAllAnnouncementsAdmin(),
        getAllPartners(),
      ]);
      setAnnouncements(annData);
      setPartners(partnerData);
    } catch (err) {
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !content.trim()) {
      setFormError('Başlık ve içerik doldurulmalıdır.');
      return;
    }

    setSubmitting(true);

    try {
      const ok = await createAnnouncementAdmin({
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        publication_status: pubStatus,
        target_audience: targetAudience,
        target_partner_ids: targetPartnerIds,
      });

      if (ok) {
        setShowCreateModal(false);
        setTitle('');
        setContent('');
        await loadData();
      } else {
        setFormError('Duyuru oluşturulurken hata oluştu.');
      }
    } catch {
      setFormError('İşlem sırasında beklenmeyen bir hata meydana geldi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: string, currentStatus: PublicationStatus) => {
    const newStatus: PublicationStatus = currentStatus === 'Arşivlenmiş' ? 'Yayında' : 'Arşivlenmiş';
    const ok = await updateAnnouncementAdmin(id, { publication_status: newStatus });
    if (ok) {
      await loadData();
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const q = searchQuery.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Bell className="w-6 h-6 text-amber-400" />
              Duyuru Yönetimi
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Partner portalında yayınlanacak duyuruları oluşturun, hedef kitlesini belirleyin veya arşivleyin.
            </p>
          </div>

          <button
            onClick={() => {
              setShowCreateModal(true);
              setFormError(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Duyuru Oluştur</span>
          </button>
        </div>

        <div className="bg-[#121318] p-4 rounded-xl border border-zinc-800/80 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Duyurularda ara..."
              className="w-full pl-9 pr-3 py-2 bg-[#0a0a0c] border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-purple-500"
            />
          </div>
          <span className="text-xs text-zinc-400 font-semibold hidden sm:block">
            Toplam {filteredAnnouncements.length} Duyuru
          </span>
        </div>

        {showCreateModal && (
          <div className="bg-[#121318] p-6 rounded-2xl border border-purple-800/60 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                Yeni Duyuru Yayınla
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Kapat [X]
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400">Duyuru Başlığı</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Örn: 2026 Q2 Etkinlik Takvimi Açıklandı"
                    className="w-full p-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                    className="w-full p-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400">Öncelik Derecesi</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                    className="w-full p-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                  >
                    {priorities.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400">Yayın Durumu</label>
                  <select
                    value={pubStatus}
                    onChange={(e) => setPubStatus(e.target.value as PublicationStatus)}
                    className="w-full p-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                  >
                    <option value="Yayında">Yayında</option>
                    <option value="Taslak">Taslak</option>
                    <option value="Zamanlanmış">Zamanlanmış</option>
                    <option value="Arşivlenmiş">Arşivlenmiş</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400">Hedef Kitle</label>
                <div className="flex items-center gap-4 text-xs text-zinc-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetAudience"
                      checked={targetAudience === 'all'}
                      onChange={() => setTargetAudience('all')}
                      className="accent-purple-600"
                    />
                    <span>Tüm Partnerler</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetAudience"
                      checked={targetAudience === 'specific'}
                      onChange={() => setTargetAudience('specific')}
                      className="accent-purple-600"
                    />
                    <span>Belirli Partnerler</span>
                  </label>
                </div>
              </div>

              {targetAudience === 'specific' && (
                <div className="p-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl space-y-2">
                  <label className="block text-xs font-semibold text-zinc-400">
                    Duyurunun İletileceği Partnerleri Seçin:
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {partners.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={targetPartnerIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTargetPartnerIds([...targetPartnerIds, p.id]);
                            } else {
                              setTargetPartnerIds(targetPartnerIds.filter((id) => id !== p.id));
                            }
                          }}
                          className="accent-purple-600"
                        />
                        <span>{p.display_name} (@{p.username})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400">Duyuru İçeriği</label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Duyuru detay metni..."
                  className="w-full p-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Duyuruyu Yayınla</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-[#121318] p-12 rounded-2xl border border-zinc-800/80 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-400 font-medium">Duyuru kaydı bulunamadı.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnnouncements.map((a) => (
              <div
                key={a.id}
                className="bg-[#121318] p-5 rounded-2xl border border-zinc-800/80 space-y-3 shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {a.category}
                    </span>
                    <StatusBadge status={a.priority} size="sm" />
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                        a.publication_status === 'Yayında'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {a.publication_status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleArchive(a.id, a.publication_status)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>{a.publication_status === 'Arşivlenmiş' ? 'Yayına Al' : 'Arşivle'}</span>
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight">{a.title}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{a.content}</p>

                <div className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/60 flex items-center justify-between">
                  <span>Hedef Kitle: {a.target_audience === 'all' ? 'Tüm Partnerler' : 'Özel Partner Listesi'}</span>
                  <span>{new Date(a.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
