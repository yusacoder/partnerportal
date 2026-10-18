import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Partner,
  PartnerStatus,
  PartnerStatusHistory,
  Announcement,
  SupportTicket,
  SupportMessage,
  SupportInternalNote,
  AuditLog,
  ContactInfo,
  TicketStatus,
  TicketCategory,
  AnnouncementCategory,
  AnnouncementPriority,
  PublicationStatus,
  StatusType
} from '../types';

export const checkDbConnection = (): boolean => {
  return isSupabaseConfigured();
};

/* =========================================================
   PARTNER API
   ========================================================= */

export const getPartnerProfile = async (authUserId: string): Promise<Partner | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching partner profile:', error);
    return null;
  }

  return data;
};

export const getPartnerStatus = async (partnerId: string): Promise<PartnerStatus | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('partner_status')
    .select('*')
    .eq('partner_id', partnerId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching partner status:', error);
    return null;
  }

  return data;
};

export const getPartnerStatusHistory = async (partnerId: string): Promise<PartnerStatusHistory[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('partner_status_history')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching partner status history:', error);
    return [];
  }

  return data || [];
};

export const getPartnerAnnouncements = async (partnerId: string): Promise<Announcement[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('publication_status', 'Yayında')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }

  if (!announcements) return [];

  const filtered = announcements.filter((a) => {
    if (a.target_audience === 'all') return true;
    if (Array.isArray(a.target_partner_ids) && a.target_partner_ids.includes(partnerId)) return true;
    return false;
  });

  const { data: reads } = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('partner_id', partnerId);

  const readIds = new Set((reads || []).map((r: { announcement_id: string }) => r.announcement_id));

  return filtered.map((a) => ({
    ...a,
    is_read: readIds.has(a.id),
  }));
};

export const markAnnouncementAsRead = async (announcementId: string, partnerId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase.from('announcement_reads').upsert(
    {
      announcement_id: announcementId,
      partner_id: partnerId,
      read_at: new Date().toISOString(),
    },
    { onConflict: 'announcement_id,partner_id' }
  );

  if (error) {
    console.error('Error marking announcement read:', error);
    return false;
  }

  return true;
};

export const getPartnerTickets = async (partnerId: string): Promise<SupportTicket[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('partner_id', partnerId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching support tickets:', error);
    return [];
  }

  return data || [];
};

export const getTicketDetails = async (ticketId: string): Promise<{
  ticket: SupportTicket | null;
  messages: SupportMessage[];
}> => {
  if (!isSupabaseConfigured()) return { ticket: null, messages: [] };

  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('*, partner:partners(*)')
    .eq('id', ticketId)
    .maybeSingle();

  if (ticketError || !ticket) {
    console.error('Error fetching ticket:', ticketError);
    return { ticket: null, messages: [] };
  }

  const { data: messages, error: msgError } = await supabase
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (msgError) {
    console.error('Error fetching ticket messages:', msgError);
  }

  return {
    ticket,
    messages: messages || [],
  };
};

export const createSupportTicket = async (data: {
  partner_id: string;
  subject: string;
  category: TicketCategory;
  description: string;
  priority: AnnouncementPriority;
}): Promise<{ success: boolean; ticket_number?: string; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Veritabanı bağlantısı kurulmamış.' };
  }

  let ticketNumber = '';
  try {
    const { data: numData } = await supabase.rpc('generate_ticket_number');
    if (numData) ticketNumber = numData;
  } catch {
    // Fallback if RPC fails
  }

  if (!ticketNumber) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.floor(1000 + Math.random() * 9000);
    ticketNumber = `TCK-${dateStr}-${randStr}`;
  }

  const { data: createdTicket, error } = await supabase
    .from('support_tickets')
    .insert({
      ticket_number: ticketNumber,
      partner_id: data.partner_id,
      subject: data.subject,
      category: data.category,
      description: data.description,
      priority: data.priority,
      status: 'Yeni',
    })
    .select()
    .single();

  if (error || !createdTicket) {
    console.error('Error creating ticket:', error);
    return { success: false, error: error?.message || 'Destek talebi oluşturulamadı.' };
  }

  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    await supabase.from('support_messages').insert({
      ticket_id: createdTicket.id,
      sender_user_id: userData.user.id,
      message: data.description,
    });
  }

  return { success: true, ticket_number: ticketNumber };
};

export const sendSupportMessage = async (
  ticketId: string,
  message: string,
  senderUserId: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender_user_id: senderUserId,
    message,
  });

  if (error) {
    console.error('Error sending message:', error);
    return false;
  }

  await supabase
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  return true;
};

export const getContactSettings = async (): Promise<ContactInfo> => {
  const defaultInfo: ContactInfo = {
    official_email: 'partner@eternalproduction.com',
    instagram_handle: '@eternalproduction',
    instagram_url: 'https://instagram.com/eternalproduction',
    discord_invite: 'https://discord.gg/eternalproduction',
    support_hours: 'Pazartesi - Cuma: 09:00 - 18:00 (TSI)',
    faq_url: 'https://eternalproduction.com/faq',
  };

  if (!isSupabaseConfigured()) return defaultInfo;

  const { data, error } = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', 'contact_info')
    .maybeSingle();

  if (error || !data) return defaultInfo;

  return { ...defaultInfo, ...(data.setting_value as Partial<ContactInfo>) };
};

/* =========================================================
   ADMIN API
   ========================================================= */

export const getAllPartners = async (): Promise<(Partner & { status_info?: PartnerStatus })[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data: partners, error } = await supabase
    .from('partners')
    .select('*, status_info:partner_status(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all partners:', error);
    return [];
  }

  return (partners || []).map((p) => ({
    ...p,
    status_info: Array.isArray(p.status_info) ? p.status_info[0] : p.status_info,
  }));
};

export const createPartnerAdmin = async (
  username: string,
  displayName: string,
  password: string,
  isActive: boolean = true
): Promise<{ success: boolean; partnerId?: string; username?: string; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Veritabanı bağlantısı bulunmuyor.' };
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanDisplayName = displayName.trim();

  if (!cleanUsername || !cleanDisplayName) {
    return { success: false, error: 'Kullanıcı adı ve firma adı zorunludur.' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'Şifre en az 6 karakter uzunluğunda olmalıdır.' };
  }

  try {
    // Call server-side RPC function admin_create_partner_user
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_create_partner_user', {
      p_username: cleanUsername,
      p_display_name: cleanDisplayName,
      p_password: password,
      p_is_active: isActive,
    });

    if (rpcError) {
      console.error('Error creating partner via RPC:', rpcError);
      if (rpcError.message?.includes('zaten kullanılmaktadır') || rpcError.code === '23505') {
        return { success: false, error: 'Bu kullanıcı adı zaten başka bir partner tarafından kullanılıyor.' };
      }
      return { success: false, error: rpcError.message || 'Partner oluşturulamadı.' };
    }

    const createdRecord = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    return {
      success: true,
      partnerId: createdRecord?.partner_id,
      username: cleanUsername,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Partner oluşturulurken hata oluştu.';
    return { success: false, error: msg };
  }
};

export const togglePartnerActiveStatus = async (
  partnerId: string,
  isActive: boolean
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('partners')
    .update({ is_active: isActive })
    .eq('id', partnerId);

  if (error) {
    console.error('Error updating active status:', error);
    return false;
  }

  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    await supabase.from('audit_logs').insert({
      actor_user_id: userData.user.id,
      action: isActive ? 'PARTNER_ACTIVATED' : 'PARTNER_DEACTIVATED',
      entity_type: 'partners',
      entity_id: partnerId,
      metadata: { is_active: isActive },
    });
  }

  return true;
};

export const updatePartnerStatusAdmin = async (data: {
  partner_id: string;
  new_status: StatusType;
  description: string;
  required_action: string;
}): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const currentStatus = await getPartnerStatus(data.partner_id);
  const prevStatusVal = currentStatus?.status || 'Normal';

  const { data: userData } = await supabase.auth.getUser();
  const adminId = userData?.user?.id || null;

  const { error } = await supabase.from('partner_status').upsert(
    {
      partner_id: data.partner_id,
      status: data.new_status,
      description: data.description,
      required_action: data.required_action,
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'partner_id' }
  );

  if (error) {
    console.error('Error updating partner status:', error);
    return false;
  }

  await supabase.from('partner_status_history').insert({
    partner_id: data.partner_id,
    previous_status: prevStatusVal,
    new_status: data.new_status,
    description: data.description,
    changed_by: adminId,
  });

  if (adminId) {
    await supabase.from('audit_logs').insert({
      actor_user_id: adminId,
      action: 'PARTNER_STATUS_CHANGED',
      entity_type: 'partner_status',
      entity_id: data.partner_id,
      metadata: { previous_status: prevStatusVal, new_status: data.new_status, description: data.description },
    });
  }

  return true;
};

export const getAllAnnouncementsAdmin = async (): Promise<Announcement[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all announcements:', error);
    return [];
  }

  return data || [];
};

export const createAnnouncementAdmin = async (data: {
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  publication_status: PublicationStatus;
  target_audience: 'all' | 'specific';
  target_partner_ids?: string[];
}): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from('announcements').insert({
    title: data.title,
    content: data.content,
    category: data.category,
    priority: data.priority,
    publication_status: data.publication_status,
    target_audience: data.target_audience,
    target_partner_ids: data.target_partner_ids || [],
    created_by: userData?.user?.id || null,
  });

  if (error) {
    console.error('Error creating announcement:', error);
    return false;
  }

  return true;
};

export const updateAnnouncementAdmin = async (
  id: string,
  data: Partial<Announcement>
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('announcements')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating announcement:', error);
    return false;
  }

  return true;
};

export const getAllTicketsAdmin = async (): Promise<SupportTicket[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('support_tickets')
    .select('*, partner:partners(*)')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin tickets:', error);
    return [];
  }

  return data || [];
};

export const updateTicketStatusAdmin = async (
  ticketId: string,
  status: TicketStatus
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  if (error) {
    console.error('Error updating ticket status:', error);
    return false;
  }

  return true;
};

export const getInternalNotesAdmin = async (ticketId: string): Promise<SupportInternalNote[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('support_internal_notes')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching internal notes:', error);
    return [];
  }

  return data || [];
};

export const addInternalNoteAdmin = async (ticketId: string, note: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return false;

  const { error } = await supabase.from('support_internal_notes').insert({
    ticket_id: ticketId,
    admin_user_id: userData.user.id,
    note,
  });

  if (error) {
    console.error('Error adding internal note:', error);
    return false;
  }

  return true;
};

export const getAuditLogsAdmin = async (): Promise<AuditLog[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data || [];
};

export const updateContactSettingsAdmin = async (info: ContactInfo): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from('app_settings').upsert(
    {
      setting_key: 'contact_info',
      setting_value: info as unknown as Record<string, unknown>,
      updated_by: userData?.user?.id || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'setting_key' }
  );

  if (error) {
    console.error('Error updating contact settings:', error);
    return false;
  }

  return true;
};
