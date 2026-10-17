import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Plus, Filter, Search, Loader2, HelpCircle, ChevronRight, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PartnerLayout } from '../../components/PartnerLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { getPartnerTickets } from '../../services/api';
import type { SupportTicket } from '../../types';

export const SupportTicketsPage: React.FC = () => {
  const { partner } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('Hepsi');
  const [searchQuery, setSearchQuery] = useState('');

  const statusOptions = ['Hepsi', 'Yeni', 'İnceleniyor', 'Yanıt bekleniyor', 'Çözüldü', 'Kapatıldı'];

  useEffect(() => {
    let isMounted = true;

    const loadTickets = async () => {
      if (!partner?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getPartnerTickets(partner.id);
        if (isMounted) setTickets(data);
      } catch (err) {
        console.error('Error loading tickets:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTickets();

    return () => {
      isMounted = false;
    };
  }, [partner?.id]);

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'Hepsi' || t.status === statusFilter;
    const matchesSearch =
      t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <PartnerLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <MessageSquare className="w-6 h-6 text-blue-400" />
              Şikâyet ve Destek Sistemi
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Sorularınız, bildirimleriniz ve destek talepleriniz için yönetim ekibiyle doğrudan iletişim kurun.
            </p>
          </div>

          <Link
            to="/partner/support/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Destek Talebi Oluştur</span>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-[#121318] p-4 rounded-xl border border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <Filter className="w-4 h-4 text-zinc-500 shrink-0 ml-1 mr-2 hidden sm:block" />
            {statusOptions.map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-purple-950 text-purple-300 border border-purple-800/80'
                    : 'bg-[#0a0a0c] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Talep no veya konu ara..."
              className="w-full pl-9 pr-3 py-2 bg-[#0a0a0c] border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-purple-500"
            />
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-[#121318] p-12 rounded-2xl border border-zinc-800/80 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-400 font-medium">
              Kriterlerinize uyan kayıtlı destek talebi bulunamadı.
            </p>
            <Link
              to="/partner/support/new"
              className="inline-block mt-2 text-xs font-bold text-purple-400 hover:text-purple-300"
            >
              + İlk destek talebinizi oluşturun
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((t) => (
              <Link
                key={t.id}
                to={`/partner/support/${t.id}`}
                className="block bg-[#121318] p-5 rounded-2xl border border-zinc-800/80 hover:border-purple-500/50 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2.5 py-0.5 rounded-md">
                      {t.ticket_number}
                    </span>
                    <span className="text-xs font-medium text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md">
                      {t.category}
                    </span>
                    <StatusBadge status={t.priority} size="sm" />
                  </div>
                  <StatusBadge status={t.status} size="sm" />
                </div>

                <div className="flex items-center justify-between mt-2">
                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    {t.subject}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-purple-400 transition-colors shrink-0 ml-2" />
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="line-clamp-1 max-w-md text-zinc-400">
                    {t.description}
                  </span>
                  <span className="flex items-center gap-1 shrink-0 ml-2">
                    <Clock className="w-3 h-3" />
                    {new Date(t.created_at).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PartnerLayout>
  );
};
