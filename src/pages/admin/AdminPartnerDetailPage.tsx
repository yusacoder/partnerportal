import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Power,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  MessageSquare,
  History,
  Send,
  KeyRound,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { StatusBadge } from '../../components/StatusBadge';
import {
  getAllPartners,
  getPartnerStatus,
  getPartnerStatusHistory,
  getPartnerTickets,
  updatePartnerStatusAdmin,
  togglePartnerActiveStatus,
} from '../../services/api';
import type { Partner, PartnerStatus, PartnerStatusHistory, SupportTicket, StatusType } from '../../types';

export const AdminPartnerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [partner, setPartner] = useState<Partner | null>(null);
  const [status, setStatus] = useState<PartnerStatus | null>(null);
  const [history, setHistory] = useState<PartnerStatusHistory[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const [newStatus, setNewStatus] = useState<StatusType>('Normal');
  const [description, setDescription] = useState('');
  const [requiredAction, setRequiredAction] = useState('');
  const [updating, setUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const loadPartnerData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const allPartners = await getAllPartners();
      const found = allPartners.find((p) => p.id === id);

      if (found) {
        setPartner(found);
        const [stData, histData, tickData] = await Promise.all([
          getPartnerStatus(id),
          getPartnerStatusHistory(id),
          getPartnerTickets(id),
        ]);

        setStatus(stData);
        if (stData) {
          setNewStatus(stData.status);
          setDescription(stData.description || '');
          setRequiredAction(stData.required_action || '');
        }
        setHistory(histData);
        setTickets(tickData);
      }
    } catch (err) {
      console.error('Error loading partner detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartnerData();
  }, [id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setUpdating(true);
    setStatusMessage(null);

    try {
      const ok = await updatePartnerStatusAdmin({
        partner_id: id,
        new_status: newStatus,
        description,
        required_action: requiredAction,
      });

      if (ok) {
        setStatusMessage('Partner statüsü ve açıklaması başarıyla güncellendi.');
        await loadPartnerData();
      } else {
        setStatusMessage('Güncelleme sırasında hata oluştu.');
      }
    } catch {
      setStatusMessage('İşlem yapılırken bir hata meydana geldi.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleActive = async () => {
    if (!partner) return;
    const ok = await togglePartnerActiveStatus(partner.id, !partner.is_active);
    if (ok) {
      await loadPartnerData();
    }
  };

  const inviteLink = partner?.invite_token
    ? `${window.location.origin}/partner/invite?token=${partner.invite_token}`
    : null;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <Link
          to="/admin/partners"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Partner Listesine Dön</span>
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : !partner ? (
          <div className="bg-[#121318] p-12 rounded-2xl border border-zinc-800 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-white">Partner Bulunamadı</h2>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                    {partner.display_name}
                  </h1>
                  <p className="text-xs font-mono text-purple-400 mt-1">@{partner.username}</p>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={status?.status || 'Normal'} size="lg" />
                  <button
                    onClick={handleToggleActive}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                      partner.is_active
                        ? 'bg-rose-950/60 text-rose-300 border-rose-800/80 hover:bg-rose-900'
                        : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{partner.is_active ? 'Hesabı Pasife Al' : 'Hesabı Aktifleştir'}</span>
                  </button>
                </div>
              </div>

              {inviteLink && (
                <div className="p-4 bg-[#0a0a0c] border border-amber-800/60 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4" />
                    Bekleyen Davet Bağlantısı:
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-purple-300"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">Hesap Statüsü & Değerlendirme Düzenle</h2>
              </div>

              {statusMessage && (
                <div className="p-3 bg-purple-950/80 border border-purple-800 rounded-xl text-xs text-purple-200">
                  {statusMessage}
                </div>
              )}

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase">
                    Hesap Durumu Seçin
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Normal', 'Şüpheli', 'Riskli', 'Askıda'] as StatusType[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setNewStatus(st)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          newStatus === st
                            ? 'bg-purple-950 text-purple-200 border-2 border-purple-600'
                            : 'bg-[#0a0a0c] text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase">
                    Açıklama / Yönetici Notu (Partner Görür)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Partnerin portalında görünecek statü açıklaması..."
                    className="w-full p-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase">
                    Yapılması Gereken İşlem (Partner Görür)
                  </label>
                  <input
                    type="text"
                    value={requiredAction}
                    onChange={(e) => setRequiredAction(e.target.value)}
                    placeholder="Örn: Evrak doğrulaması tamamlanmalıdır."
                    className="w-full p-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Durumu Kaydet ve Güncelle</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <History className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Durum Değişiklik Geçmişi</h3>
                </div>

                {history.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    Kayıtlı geçmiş bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {history.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 bg-[#0a0a0c] rounded-xl border border-zinc-800/80 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                          <span>{new Date(h.created_at).toLocaleDateString('tr-TR')}</span>
                          <span>{h.previous_status} ➔ {h.new_status}</span>
                        </div>
                        <div className="text-zinc-300">{h.description || 'Açıklama yok'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Partnerin Destek Talepleri</h3>
                </div>

                {tickets.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    Açık talep bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {tickets.map((t) => (
                      <Link
                        key={t.id}
                        to="/admin/support"
                        className="block p-3 bg-[#0a0a0c] rounded-xl border border-zinc-800 hover:border-purple-500/50 text-xs transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-purple-400">{t.ticket_number}</span>
                          <StatusBadge status={t.status} size="sm" />
                        </div>
                        <div className="font-bold text-white mt-1">{t.subject}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
