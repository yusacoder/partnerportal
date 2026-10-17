import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Loader2,
  Copy,
  Check,
  Power,
  ChevronRight,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { getAllPartners, createPartnerAdmin, togglePartnerActiveStatus } from '../../services/api';
import type { Partner, PartnerStatus } from '../../types';

export const AdminPartnersPage: React.FC = () => {
  const [partners, setPartners] = useState<(Partner & { status_info?: PartnerStatus })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const data = await getAllPartners();
      setPartners(data);
    } catch (err) {
      console.error('Error loading partners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setGeneratedInviteLink(null);

    if (!username.trim() || !displayName.trim()) {
      setErrorMessage('Kullanıcı adı ve görünen isim zorunludur.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await createPartnerAdmin(username, displayName);
      if (res.success && res.inviteToken) {
        const fullLink = `${window.location.origin}/partner/invite?token=${res.inviteToken}`;
        setGeneratedInviteLink(fullLink);
        setUsername('');
        setDisplayName('');
        await loadPartners();
      } else {
        setErrorMessage(res.error || 'Partner oluşturulamadı.');
      }
    } catch {
      setErrorMessage('İşlem sırasında beklenmeyen bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (partnerId: string, currentActive: boolean) => {
    const ok = await togglePartnerActiveStatus(partnerId, !currentActive);
    if (ok) {
      await loadPartners();
    }
  };

  const handleCopyInvite = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredPartners = partners.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.username.toLowerCase().includes(q) ||
      p.display_name.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-purple-400" />
              Partner Yönetimi
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Ajans bünyesindeki tüm partner hesaplarının durum kontrolü, aktivasyonu ve davet yönetimi.
            </p>
          </div>

          <button
            onClick={() => {
              setShowAddModal(true);
              setGeneratedInviteLink(null);
              setErrorMessage(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Partner Tanımla</span>
          </button>
        </div>

        <div className="bg-[#121318] p-4 rounded-xl border border-zinc-800/80 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kullanıcı adı veya partner ismi ara..."
              className="w-full pl-9 pr-3 py-2 bg-[#0a0a0c] border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-purple-500"
            />
          </div>
          <span className="text-xs text-zinc-400 font-semibold hidden sm:block">
            Toplam {filteredPartners.length} Partner
          </span>
        </div>

        {showAddModal && (
          <div className="bg-[#121318] p-6 rounded-2xl border border-purple-800/60 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-400" />
                Yeni Partner Tanımla ve Davet Oluştur
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Kapat [X]
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300">
                {errorMessage}
              </div>
            )}

            {generatedInviteLink ? (
              <div className="p-4 bg-[#0a0a0c] border border-emerald-800/80 rounded-xl space-y-3">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Partner Kaydı Oluşturuldu! Güvenli Davet Bağlantısı:
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteLink}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-purple-300 select-all"
                  />
                  <button
                    onClick={() => handleCopyInvite(generatedInviteLink)}
                    className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Bu davet bağlantısını partnerinize iletin. Partner bu bağlantı üzerinden ilk şifresini güvenle belirleyebilir.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreatePartner} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400">Kullanıcı Adı</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Örn: partner_ahmet"
                    className="w-full px-3 py-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400">Görünen Ad / Firma</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Örn: Ahmet Yılmaz Ajansı"
                    className="w-full px-3 py-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
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
                    <span>Kaydet ve Davet Linki Üret</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="bg-[#121318] p-12 rounded-2xl border border-zinc-800/80 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-400 font-medium">Kayıtlı partner bulunamadı.</p>
          </div>
        ) : (
          <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#0a0a0c] text-zinc-400 font-semibold uppercase tracking-wider text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Partner İsmi & Kullanıcı Adı</th>
                    <th className="p-4">Hesap Statüsü</th>
                    <th className="p-4">Hesap Durumu</th>
                    <th className="p-4">Kayıt Tarihi</th>
                    <th className="p-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredPartners.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{p.display_name}</div>
                        <div className="text-zinc-500 font-mono text-[11px]">@{p.username}</div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={p.status_info?.status || 'Normal'} size="sm" />
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-semibold text-[11px] ${
                            p.is_active
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                              : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                          }`}
                        >
                          {p.is_active ? 'Aktif' : 'Pasif / Engelli'}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-400 whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(p.id, p.is_active)}
                            title={p.is_active ? 'Hesabı Pasife Al' : 'Hesabı Aktifleştir'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              p.is_active
                                ? 'bg-zinc-900 text-rose-400 border-zinc-800 hover:bg-rose-950'
                                : 'bg-zinc-900 text-emerald-400 border-zinc-800 hover:bg-emerald-950'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            to={`/admin/partners/${p.id}`}
                            className="px-3 py-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-200 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <span>Yönet</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
