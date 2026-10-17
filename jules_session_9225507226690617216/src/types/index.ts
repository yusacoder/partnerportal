export type UserRole = 'admin' | 'partner';

export type StatusType = 'Normal' | 'Şüpheli' | 'Riskli' | 'Askıda';

export type AnnouncementCategory = 
  | 'Genel duyuru'
  | 'İş birliği'
  | 'Etkinlik'
  | 'Kampanya'
  | 'Sistem bakımı'
  | 'Önemli bilgilendirme';

export type AnnouncementPriority = 'Düşük' | 'Normal' | 'Yüksek' | 'Acil';

export type PublicationStatus = 'Taslak' | 'Zamanlanmış' | 'Yayında' | 'Arşivlenmiş';

export type TicketCategory =
  | 'Hesap durumu hakkında soru'
  | 'İş birliği sorunu'
  | 'Yönetim hakkında şikâyet'
  | 'Teknik sorun'
  | 'Ödeme veya anlaşma hakkında soru'
  | 'Diğer';

export type TicketStatus = 'Yeni' | 'İnceleniyor' | 'Yanıt bekleniyor' | 'Çözüldü' | 'Kapatıldı';

export interface Partner {
  id: string;
  auth_user_id: string | null;
  username: string;
  display_name: string;
  is_active: boolean;
  invite_token?: string | null;
  invite_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerStatus {
  id: string;
  partner_id: string;
  status: StatusType;
  description: string;
  required_action: string;
  updated_by: string | null;
  updated_at: string;
}

export interface PartnerStatusHistory {
  id: string;
  partner_id: string;
  previous_status: StatusType;
  new_status: StatusType;
  description: string;
  changed_by: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  publication_status: PublicationStatus;
  target_audience: 'all' | 'specific';
  target_partner_ids?: string[];
  published_at: string | null;
  scheduled_at?: string | null;
  expires_at?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_read?: boolean;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  partner_id: string;
  subject: string;
  category: TicketCategory;
  description: string;
  priority: AnnouncementPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  partner?: Partner;
  unread_count?: number;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_user_id: string;
  message: string;
  created_at: string;
  sender_role?: UserRole;
  sender_name?: string;
}

export interface SupportInternalNote {
  id: string;
  ticket_id: string;
  admin_user_id: string;
  note: string;
  created_at: string;
  admin_name?: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_name?: string;
}

export interface ContactInfo {
  official_email: string;
  instagram_handle: string;
  instagram_url: string;
  discord_invite: string;
  support_hours: string;
  faq_url: string;
}
