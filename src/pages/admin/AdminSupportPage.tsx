import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Filter,
  Search,
  Loader2,
  Send,
  Lock,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { StatusBadge } from '../../components/StatusBadge';
import {
  getAllTicketsAdmin,
  getTicketDetails,
  sendSupportMessage,
  updateTicketStatusAdmin,
  getInternalNotesAdmin,
  addInternalNoteAdmin,
} from '../../services/api';
import type { SupportTicket, SupportMessage, SupportInternalNote, TicketStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminSupportPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('Hepsi');
  const [searchQuery, setSearchQuery] = useState('');

  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [activeMessages, setActiveMessages] = useState<SupportMessage[]>([]);
  const [internalNotes, setInternalNotes] = useState<SupportInternalNote[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [newInternalNote, setNewInternalNote] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  const statusList = ['Hepsi', 'Yeni', 'İnceleniyor', 'Yanıt bekleniyor', 'Çözüldü', 'Kapatıldı'];

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await getAllTicketsAdmin();
      setTickets(data);
    } catch (err) {
      console.error('Error loading admin tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    try {
      const [{ messages }, notes] = await Promise.all([
        getTicketDetails(ticket.id),
        getInternalNotesAdmin(ticket.id),
      ]);
      setActiveMessages(messages);
      setInternalNotes(notes);
    } catch (err) {
      console.error('Error loading ticket details for admin:', err);
    }
  };

  const handleSendPublicReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket || !user?.id) return;

    setSubmittingReply(true);
    try {
      const ok = await sendSupportMessage(activeTicket.id, replyMessage.trim(), user.id);
      if (ok) {
        setReplyMessage('');
        const { messages } = await getTicketDetails(activeTicket.id);
        setActiveMessages(messages);
        await loadTickets();
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternalNote.trim() || !activeTicket) return;

    setSubmittingNote(true);
    try {
      const ok = await addInternalNoteAdmin(activeTicket.id, newInternalNote.trim());
      if (ok) {
        setNewInternalNote('');
        const notes = await getInternalNotesAdmin(activeTicket.id);
        setInternalNotes(notes);
      }
    } catch (err) {
      console.error('Error adding internal note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleChangeTicketStatus = async (status: TicketStatus) => {
    if (!activeTicket) return;
    const ok = await updateTicketStatusAdmin(activeTicket.id, status);
    if (ok) {
      setActiveTicket({ ...activeTicket, status });
      await loadTickets();
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = selectedStatus === 'Hepsi' || t.status === selectedStatus;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      t.ticket_number.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      (t.partner?.display_name && t.partner.display_name.toLowerCase().includes(q));
    return matchesStatus && matchesQuery;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            Destek ve Şikâyet Talepleri Yönetimi
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Partnerlerin ilettiği tüm destek taleplerini yanıtlayın, durumlarını değiştirin veya gizli iç notlar ekleyin.
          </p>
        </div>

        <div className="bg-[#121318] p-4 rounded-xl border border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <Filter className="w-4 h-4 text-zinc-500 shrink-0 ml-1 mr-2 hidden sm:block" />
            {statusList.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedStatus === s
                    ? 'bg-purple-950 text-purple-300 border border-purple-800/80'
                    : 'bg-[#0a0a0c] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Talep veya partner ara..."
              className="w-full pl-9 pr-3 py-2 bg-[#0a0a0c] border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-[#121318] rounded-2xl border border-zinc-800/80 p-4 space-y-3 h-[700px] flex flex-col">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 pb-2 border-b border-zinc-800">
              Talepler ({filteredTickets.length})
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 p-4 text-center">
                Talep kaydı bulunamadı.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredTickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTicket(t)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      activeTicket?.id === t.id
                        ? 'bg-purple-950/60 border-purple-600/80 text-white shadow-md'
                        : 'bg-[#0a0a0c] border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-purple-400">{t.ticket_number}</span>
                      <StatusBadge status={t.status} size="sm" />
                    </div>
                    <div className="font-bold text-white text-xs line-clamp-1">{t.subject}</div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2">
                      <span>{t.partner?.display_name || 'Partner'}</span>
                      <span>{new Date(t.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-[#121318] rounded-2xl border border-zinc-800/80 p-6 h-[700px] flex flex-col space-y-4">
            {!activeTicket ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
                <MessageSquare className="w-12 h-12 text-zinc-700" />
                <p className="text-xs">Detaylarını görüntülemek için sol listeden bir destek talebi seçin.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-y-auto space-y-5 pr-1">
                <div className="border-b border-zinc-800 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950 px-2.5 py-1 rounded-md border border-purple-800">
                      {activeTicket.ticket_number}
                    </span>
                    <StatusBadge status={activeTicket.status} size="md" />
                  </div>
                  <h2 className="text-lg font-black text-white">{activeTicket.subject}</h2>
                  <div className="text-xs text-zinc-400 flex items-center justify-between">
                    <span>Gönderen: <strong className="text-white">{activeTicket.partner?.display_name}</strong> (@{activeTicket.partner?.username})</span>
                    <span>Kategori: {activeTicket.category}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Talep Durumunu Değiştir</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['Yeni', 'İnceleniyor', 'Yanıt bekleniyor', 'Çözüldü', 'Kapatıldı'] as TicketStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleChangeTicketStatus(st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          activeTicket.status === st
                            ? 'bg-purple-700 text-white'
                            : 'bg-[#0a0a0c] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Herkese Açık Mesajlaşma</span>
                  <div className="space-y-3 max-h-52 overflow-y-auto p-3 bg-[#0a0a0c] rounded-xl border border-zinc-800">
                    {activeMessages.map((msg) => {
                      const isPartnerSender = msg.sender_user_id === activeTicket.partner?.auth_user_id;

                      return (
                        <div key={msg.id} className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-zinc-400">
                            <span className={isPartnerSender ? 'text-purple-400 font-bold' : 'text-emerald-400 font-bold'}>
                              {isPartnerSender ? activeTicket.partner?.display_name : 'Ajans Yetkilisi'}
                            </span>
                            <span>{new Date(msg.created_at).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-zinc-200 whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={handleSendPublicReply} className="space-y-2">
                  <textarea
                    rows={2}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Partnere açık yanıt yazın..."
                    className="w-full p-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-purple-500 resize-y"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReply || !replyMessage.trim()}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {submittingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Partnere Yanıt Gönder</span>
                    </button>
                  </div>
                </form>

                <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <Lock className="w-4 h-4" />
                    <span>Gizli Yönetici İç Notları (Partner Kesinlikle Göremez)</span>
                  </div>

                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {internalNotes.length === 0 ? (
                      <div className="text-[11px] text-zinc-500">Henüz iç not eklenmedi.</div>
                    ) : (
                      internalNotes.map((note) => (
                        <div key={note.id} className="p-2.5 bg-[#0a0a0c] border border-amber-900/40 rounded-lg text-xs space-y-1">
                          <div className="text-[10px] text-amber-500 font-semibold">
                            Yönetici Notu • {new Date(note.created_at).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <p className="text-amber-200/90">{note.note}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddInternalNote} className="flex gap-2">
                    <input
                      type="text"
                      value={newInternalNote}
                      onChange={(e) => setNewInternalNote(e.target.value)}
                      placeholder="Sadece yöneticilerin görebileceği iç not ekleyin..."
                      className="flex-1 px-3 py-2 bg-[#0a0a0c] border border-amber-900/60 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={submittingNote || !newInternalNote.trim()}
                      className="px-3 py-2 bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {submittingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ekle'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
