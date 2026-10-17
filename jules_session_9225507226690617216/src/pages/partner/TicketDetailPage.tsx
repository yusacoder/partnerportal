import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Loader2,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PartnerLayout } from '../../components/PartnerLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { getTicketDetails, sendSupportMessage } from '../../services/api';
import type { SupportTicket, SupportMessage } from '../../types';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { ticket: ticketData, messages: msgs } = await getTicketDetails(id);
      setTicket(ticketData);
      setMessages(msgs);
    } catch (err) {
      console.error('Error loading ticket detail:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !id || !user?.id) return;

    setSending(true);
    setErrorMessage(null);

    try {
      const ok = await sendSupportMessage(id, replyText.trim(), user.id);
      if (ok) {
        setReplyText('');
        await loadData();
      } else {
        setErrorMessage('Mesajınız gönderilemedi.');
      }
    } catch {
      setErrorMessage('Mesaj iletilirken bir hata oluştu.');
    } finally {
      setSending(false);
    }
  };

  return (
    <PartnerLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to="/partner/support"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tüm Taleplerime Dön</span>
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : !ticket ? (
          <div className="bg-[#121318] p-12 rounded-2xl border border-zinc-800 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-white">Talep Bulunamadı</h2>
            <p className="text-xs text-zinc-400">
              Bu talebe erişim izniniz yok veya kayıt silinmiş olabilir.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-purple-400 bg-purple-950/80 border border-purple-800 px-3 py-1 rounded-lg">
                    {ticket.ticket_number}
                  </span>
                  <span className="text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
                    {ticket.category}
                  </span>
                  <StatusBadge status={ticket.priority} size="sm" />
                </div>

                <StatusBadge status={ticket.status} size="lg" />
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {ticket.subject}
              </h1>

              <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  Oluşturulma:{' '}
                  {new Date(ticket.created_at).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">Mesajlaşma Geçmişi</h2>
              </div>

              <div className="space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.sender_user_id === user?.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[11px] text-zinc-400">
                        {isMe ? (
                          <>
                            <span className="font-semibold text-purple-300">Siz</span>
                            <User className="w-3.5 h-3.5 text-purple-400" />
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-semibold text-emerald-400">Ajans Yönetimi</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(msg.created_at).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div
                        className={`max-w-2xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                          isMe
                            ? 'bg-purple-950/70 border border-purple-800/60 text-purple-100 rounded-tr-none'
                            : 'bg-[#0a0a0c] border border-zinc-800 text-zinc-200 rounded-tl-none'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {ticket.status === 'Kapatıldı' ? (
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl text-center text-xs text-zinc-400">
                  Bu destek talebi kapatılmıştır. Yeni sorularınız için lütfen yeni bir talep oluşturun.
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="space-y-3 pt-4 border-t border-zinc-800">
                  {errorMessage && (
                    <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300">
                      {errorMessage}
                    </div>
                  )}

                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Yanıtınızı buraya yazın..."
                    className="w-full p-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-purple-500 resize-y"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-bold text-xs rounded-xl transition-colors shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Gönderiliyor...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Yanıtı Gönder</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </PartnerLayout>
  );
};
