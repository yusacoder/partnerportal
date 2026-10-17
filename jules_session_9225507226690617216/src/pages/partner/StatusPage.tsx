import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Loader2,
  History,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PartnerLayout } from '../../components/PartnerLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { getPartnerStatus, getPartnerStatusHistory } from '../../services/api';
import type { PartnerStatus, PartnerStatusHistory } from '../../types';

export const StatusPage: React.FC = () => {
  const { partner } = useAuth();
  const [status, setStatus] = useState<PartnerStatus | null>(null);
  const [history, setHistory] = useState<PartnerStatusHistory[]>([]);
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
        const [statusData, historyData] = await Promise.all([
          getPartnerStatus(partner.id),
          getPartnerStatusHistory(partner.id),
        ]);

        if (isMounted) {
          setStatus(statusData);
          setHistory(historyData);
        }
      } catch (err) {
        console.error('Error fetching status data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [partner?.id]);

  const currentStatus = status?.status || 'Normal';

  return (
    <PartnerLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            Hesap Durumu Sistem
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Eternal Production bünyesindeki partner hesabınızın ajans değerlendirme ve takip statüsü.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Current Status Card */}
            <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
                    Güncel Değerlendirme Durumu
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <StatusBadge status={currentStatus} size="lg" />
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-zinc-400 space-y-1 bg-[#0a0a0c] p-3 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-1.5 justify-start sm:justify-end">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Son Güncelleme Tarihi:</span>
                  </div>
                  <div className="font-semibold text-zinc-200">
                    {status?.updated_at
                      ? new Date(status.updated_at).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Kayıt bulunmuyor'}
                  </div>
                </div>
              </div>

              {/* Status Explanation & Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Description Box */}
                <div className="bg-[#0a0a0c] p-4 sm:p-5 rounded-xl border border-zinc-800/80 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Yönetici Açıklaması
                  </span>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {status?.description || 'Hesabınız için herhangi bir özel açıklama bulunmamaktadır.'}
                  </p>
                </div>

                {/* Required Action Box */}
                <div className="bg-[#0a0a0c] p-4 sm:p-5 rounded-xl border border-zinc-800/80 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Yapılması Gereken İşlem
                  </span>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {status?.required_action || 'Şu an için yapılması gereken herhangi bir ek işlem yoktur.'}
                  </p>
                </div>
              </div>

              {/* Legal / Policy Clarification Notice */}
              <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded-xl text-xs text-purple-300/90 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-purple-200">Ajans Takip Notu</p>
                  <p className="text-[11px] leading-normal text-zinc-400">
                    Bu sayfadaki durum bilgisi yalnızca Eternal Production ajansı bünyesindeki iç takip ve iş birliği değerlendirme kayıtlarını temsil etmektedir. Harici sosyal medya platformlarının resmi hesap risk durumlarını otomatik olarak bildirmemektedir.
                  </p>
                </div>
              </div>
            </div>

            {/* Status History Table */}
            <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                <History className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">Durum Değişiklik Geçmişi</h2>
              </div>

              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-zinc-700" />
                  <span>Geçmiş durum değişikliği kaydı bulunmamaktadır.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-[#0a0a0c] text-zinc-400 font-semibold uppercase tracking-wider text-[10px] border-b border-zinc-800">
                      <tr>
                        <th className="p-3">Tarih</th>
                        <th className="p-3">Önceki Durum</th>
                        <th className="p-3">Yeni Durum</th>
                        <th className="p-3">Açıklama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="p-3 whitespace-nowrap text-zinc-400">
                            {new Date(item.created_at).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <StatusBadge status={item.previous_status} size="sm" />
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <StatusBadge status={item.new_status} size="sm" />
                          </td>
                          <td className="p-3 max-w-md text-zinc-300">
                            {item.description || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PartnerLayout>
  );
};
