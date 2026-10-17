import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2, AlertCircle, Loader2, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PartnerLayout } from '../../components/PartnerLayout';
import { createSupportTicket } from '../../services/api';
import type { TicketCategory, AnnouncementPriority } from '../../types';

export const NewTicketPage: React.FC = () => {
  const { partner, isDbConnected } = useAuth();
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Hesap durumu hakkında soru');
  const [priority, setPriority] = useState<AnnouncementPriority>('Normal');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);

  const categories: TicketCategory[] = [
    'Hesap durumu hakkında soru',
    'İş birliği sorunu',
    'Yönetim hakkında şikâyet',
    'Teknik sorun',
    'Ödeme veya anlaşma hakkında soru',
    'Diğer',
  ];

  const priorities: AnnouncementPriority[] = ['Düşük', 'Normal', 'Yüksek', 'Acil'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!subject.trim() || !description.trim()) {
      setErrorMessage('Lütfen konu başlığı ve detaylı açıklama alanlarını doldurun.');
      return;
    }

    if (!partner?.id) {
      setErrorMessage('Partner profiliniz yüklenemedi. Oturumu kapatıp tekrar giriş yapın.');
      return;
    }

    if (!isDbConnected) {
      setErrorMessage('Veritabanı bağlantısı yapılandırılmamıştır.');
      return;
    }

    setLoading(true);

    try {
      const res = await createSupportTicket({
        partner_id: partner.id,
        subject: subject.trim(),
        category,
        description: description.trim(),
        priority,
      });

      if (res.success && res.ticket_number) {
        setCreatedTicketNumber(res.ticket_number);
      } else {
        setErrorMessage(res.error || 'Destek talebi oluşturulurken hata oluştu.');
      }
    } catch {
      setErrorMessage('İşlem sırasında beklenmeyen bir sorun meydana geldi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PartnerLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          to="/partner/support"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Destek Taleplerine Dön</span>
        </Link>

        {/* Success Modal / Card after Creation */}
        {createdTicketNumber ? (
          <div className="bg-[#121318] p-8 rounded-2xl border border-emerald-800/80 shadow-2xl text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-950 rounded-full border border-emerald-700 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Destek Talebiniz Oluşturuldu
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Talebiniz başarıyla kayda alınmış ve yönetim ekibimize iletilmiştir.
              </p>
            </div>

            <div className="p-4 bg-[#0a0a0c] border border-zinc-800 rounded-xl inline-block max-w-sm w-full mx-auto">
              <span className="text-xs text-zinc-500 font-medium block uppercase tracking-wider mb-1">
                Talep Numaranız
              </span>
              <span className="text-lg font-mono font-black text-purple-400">
                {createdTicketNumber}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/partner/support')}
                className="w-full sm:w-auto px-6 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Taleplerimi Listele
              </button>
              <button
                onClick={() => {
                  setCreatedTicketNumber(null);
                  setSubject('');
                  setDescription('');
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Yeni Bir Talep Oluştur
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-6 sm:p-8 space-y-6 shadow-xl">
            {/* Header */}
            <div className="border-b border-zinc-800 pb-4 space-y-1">
              <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-purple-400" />
                Yeni Şikâyet / Destek Talebi
              </h1>
              <p className="text-xs text-zinc-400">
                Lütfen sorununuzu veya iletmek istediğiniz konuyu açıkça ifade edin.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Talep Kategorisi
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  className="w-full px-4 py-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-purple-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Konu Başığı
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Örn: Hesap durumum hakkında detaylı bilgi talebi"
                  className="w-full px-4 py-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              {/* Priority Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Öncelik Derecesi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {priorities.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        priority === p
                          ? 'bg-purple-950 text-purple-300 border-2 border-purple-600 shadow-sm'
                          : 'bg-[#0a0a0c] text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Açıklama / Detaylar
                </label>
                <textarea
                  required
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Lütfen talebinize dair tüm ayrıntıları buraya yazın..."
                  className="w-full p-4 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-hidden focus:border-purple-500 resize-y"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-bold text-sm rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Talebi İlet</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </PartnerLayout>
  );
};
