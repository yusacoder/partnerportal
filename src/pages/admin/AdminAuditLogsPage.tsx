import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Loader2, Search, AlertCircle } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { getAuditLogsAdmin } from '../../services/api';
import type { AuditLog } from '../../types';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadLogs = async () => {
      setLoading(true);
      try {
        const data = await getAuditLogsAdmin();
        if (isMounted) setLogs(data);
      } catch (err) {
        console.error('Error loading audit logs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadLogs();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLogs = logs.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q) ||
      JSON.stringify(l.metadata || {}).toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-purple-400" />
            Sistem Denetim ve Güvenlik Kayıtları
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Yöneticiler tarafından gerçekleştirilen partner oluşturma, statü değişiklikleri ve güvenlik olayları.
          </p>
        </div>

        {/* Search */}
        <div className="bg-[#121318] p-4 rounded-xl border border-zinc-800/80 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İşlem adı veya detaylarda ara..."
              className="w-full pl-9 pr-3 py-2 bg-[#0a0a0c] border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-purple-500"
            />
          </div>
          <span className="text-xs text-zinc-400 font-semibold hidden sm:block">
            Son {filteredLogs.length} Kayıt
          </span>
        </div>

        {/* Audit Logs Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-[#121318] p-12 rounded-2xl border border-zinc-800/80 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-400 font-medium">Denetim kaydı bulunamadı.</p>
          </div>
        ) : (
          <div className="bg-[#121318] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#0a0a0c] text-zinc-400 font-semibold uppercase tracking-wider text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Tarih</th>
                    <th className="p-4">Eylem (Action)</th>
                    <th className="p-4">Varlık (Entity)</th>
                    <th className="p-4">Detaylar (Metadata)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="p-4 whitespace-nowrap text-zinc-400">
                        {new Date(log.created_at).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="p-4 font-mono font-bold text-purple-400">
                        {log.action}
                      </td>
                      <td className="p-4 font-mono text-zinc-300">
                        {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)}...)` : ''}
                      </td>
                      <td className="p-4 text-zinc-400 max-w-md font-mono text-[11px] truncate">
                        {JSON.stringify(log.metadata)}
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
