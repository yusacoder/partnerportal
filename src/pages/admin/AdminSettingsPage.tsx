import React, { useEffect, useState } from 'react';
import { Settings, Save, Mail, Instagram, Disc as Discord, Clock, HelpCircle, Loader2 } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { getContactSettings, updateContactSettingsAdmin } from '../../services/api';
import type { ContactInfo } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const [info, setInfo] = useState<ContactInfo>({
    official_email: 'partner@eternalproduction.com',
    instagram_handle: '@eternalproduction',
    instagram_url: 'https://instagram.com/eternalproduction',
    discord_invite: 'https://discord.gg/eternalproduction',
    support_hours: 'Pazartesi - Cuma: 09:00 - 18:00 (TSI)',
    faq_url: 'https://eternalproduction.com/faq',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const settings = await getContactSettings();
        if (isMounted) setInfo(settings);
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const ok = await updateContactSettingsAdmin(info);
      if (ok) {
        setMessage('İletişim ve sistem bilgileri başarıyla güncellendi.');
      } else {
        setMessage('Güncelleme sırasında bir sorun yaşandı.');
      }
    } catch {
      setMessage('Beklenmeyen bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-purple-400" />
            Sistem ve İletişim Ayarları
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Partner portalında ve iletişim sayfasında yer alan resmi ajans iletişim detaylarını yönetin.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-6 sm:p-8 space-y-6 shadow-xl">
            {message && (
              <div className="p-3.5 bg-purple-950/80 border border-purple-800 rounded-xl text-xs text-purple-200">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-purple-400" />
                    Resmî E-Posta Adresi
                  </label>
                  <input
                    type="email"
                    required
                    value={info.official_email}
                    onChange={(e) => setInfo({ ...info, official_email: e.target.value })}
                    className="w-full p-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase flex items-center gap-1.5">
                    <Instagram className="w-4 h-4 text-rose-400" />
                    Instagram Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={info.instagram_handle}
                    onChange={(e) => setInfo({ ...info, instagram_handle: e.target.value })}
                    className="w-full p-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase flex items-center gap-1.5">
                    <Instagram className="w-4 h-4 text-rose-400" />
                    Instagram Profil Bağlantısı (URL)
                  </label>
                  <input
                    type="url"
                    required
                    value={info.instagram_url}
                    onChange={(e) => setInfo({ ...info, instagram_url: e.target.value })}
                    className="w-full p-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase flex items-center gap-1.5">
                    <Discord className="w-4 h-4 text-indigo-400" />
                    Discord Davet Bağlantısı
                  </label>
                  <input
                    type="url"
                    required
                    value={info.discord_invite}
                    onChange={(e) => setInfo({ ...info, discord_invite: e.target.value })}
                    className="w-full p-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Destek ve Çalışma Saatleri
                  </label>
                  <input
                    type="text"
                    required
                    value={info.support_hours}
                    onChange={(e) => setInfo({ ...info, support_hours: e.target.value })}
                    className="w-full p-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    Sık Sorulan Sorular Bağlantısı (URL)
                  </label>
                  <input
                    type="url"
                    required
                    value={info.faq_url}
                    onChange={(e) => setInfo({ ...info, faq_url: e.target.value })}
                    className="w-full p-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Ayarları Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
