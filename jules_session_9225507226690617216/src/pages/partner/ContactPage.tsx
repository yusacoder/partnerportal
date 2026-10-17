import React, { useEffect, useState } from 'react';
import { Mail, Instagram, Disc as Discord, Clock, HelpCircle, ExternalLink, Loader2, PhoneCall } from 'lucide-react';
import { PartnerLayout } from '../../components/PartnerLayout';
import { getContactSettings } from '../../services/api';
import type { ContactInfo } from '../../types';

export const ContactPage: React.FC = () => {
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadContact = async () => {
      setLoading(true);
      try {
        const info = await getContactSettings();
        if (isMounted) setContact(info);
      } catch (err) {
        console.error('Error fetching contact info:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadContact();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PartnerLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <PhoneCall className="w-6 h-6 text-emerald-400" />
            İletişim ve Resmi Kanallar
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Eternal Production yönetim ekibine ve resmi sosyal medya kanallarına direkt erişim sağlama.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Contact Card */}
            <div className="bg-[#121318] p-6 rounded-2xl border border-zinc-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Resmî E-Posta Adresi
              </h3>
              <p className="text-xs text-zinc-400">
                Kurumsal bildirimler ve e-posta üzerinden direkt iletişim için.
              </p>
              <a
                href={`mailto:${contact?.official_email}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-purple-300 hover:text-purple-200 transition-colors pt-2"
              >
                <span>{contact?.official_email}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Instagram Contact Card */}
            <div className="bg-[#121318] p-6 rounded-2xl border border-zinc-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
                <Instagram className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Resmî Instagram
              </h3>
              <p className="text-xs text-zinc-400">
                Ajans projeleri, partner paylaşımları ve duyurular için Instagram hesabımız.
              </p>
              <a
                href={contact?.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-rose-300 hover:text-rose-200 transition-colors pt-2"
              >
                <span>{contact?.instagram_handle}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Discord Contact Card */}
            <div className="bg-[#121318] p-6 rounded-2xl border border-zinc-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                <Discord className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Discord Sunucusu
              </h3>
              <p className="text-xs text-zinc-400">
                Özel partner topluluk kanalı ve anlık ajans duyuruları.
              </p>
              <a
                href={contact?.discord_invite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-indigo-300 hover:text-indigo-200 transition-colors pt-2"
              >
                <span>Partner Discord Sunucusuna Katıl</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Support Hours Card */}
            <div className="bg-[#121318] p-6 rounded-2xl border border-zinc-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Destek & Çalışma Saatleri
              </h3>
              <p className="text-xs text-zinc-400">
                Ekibimizin taleplere dönüş sağladığı aktif çalışma zamanları.
              </p>
              <div className="text-sm font-bold text-emerald-300 pt-2">
                {contact?.support_hours}
              </div>
            </div>

            {/* FAQ Link Card */}
            <div className="md:col-span-2 bg-[#121318] p-6 rounded-2xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 shrink-0">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Sık Sorulan Sorular</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Partnerlerin en çok sorduğu sorular ve detaylı yanıt rehberimiz.
                  </p>
                </div>
              </div>
              <a
                href={contact?.faq_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-amber-950 hover:bg-amber-900 border border-amber-800/80 text-amber-200 font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center gap-2"
              >
                <span>SSS Sayfasını Ziyaret Et</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </PartnerLayout>
  );
};
