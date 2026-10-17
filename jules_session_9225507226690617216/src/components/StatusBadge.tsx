import React from 'react';
import type { StatusType, TicketStatus, AnnouncementPriority } from '../types';

interface StatusBadgeProps {
  status: StatusType | TicketStatus | AnnouncementPriority | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let styleClasses = 'bg-zinc-800 text-zinc-300 border-zinc-700';

  switch (status) {
    // Partner Statuses & Priorities
    case 'Normal':
      styleClasses = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60 shadow-xs shadow-emerald-950';
      break;
    case 'Şüpheli':
      styleClasses = 'bg-amber-950/80 text-amber-400 border-amber-800/60 shadow-xs shadow-amber-950';
      break;
    case 'Riskli':
      styleClasses = 'bg-rose-950/80 text-rose-400 border-rose-800/60 shadow-xs shadow-rose-950';
      break;
    case 'Askıda':
      styleClasses = 'bg-zinc-900 text-zinc-400 border-zinc-700';
      break;

    // Ticket Statuses
    case 'Yeni':
      styleClasses = 'bg-blue-950/80 text-blue-400 border-blue-800/60';
      break;
    case 'İnceleniyor':
      styleClasses = 'bg-amber-950/80 text-amber-400 border-amber-800/60';
      break;
    case 'Yanıt bekleniyor':
      styleClasses = 'bg-purple-950/80 text-purple-400 border-purple-800/60';
      break;
    case 'Çözüldü':
      styleClasses = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60';
      break;
    case 'Kapatıldı':
      styleClasses = 'bg-zinc-900 text-zinc-500 border-zinc-800';
      break;

    // Priorities
    case 'Acil':
      styleClasses = 'bg-rose-950/90 text-rose-300 border-rose-700 animate-pulse';
      break;
    case 'Yüksek':
      styleClasses = 'bg-orange-950/80 text-orange-400 border-orange-800/60';
      break;
    case 'Düşük':
      styleClasses = 'bg-zinc-900 text-zinc-400 border-zinc-800';
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wide',
    lg: 'text-sm px-3.5 py-1.5 font-bold tracking-wider',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${sizeClasses} ${styleClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
};
