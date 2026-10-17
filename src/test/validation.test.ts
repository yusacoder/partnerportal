import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
});

const ticketSchema = z.object({
  subject: z.string().min(5, 'Konu başlığı en az 5 karakter olmalıdır'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
});

describe('Zod Form Validation Schemas', () => {
  it('validates correct login credentials', () => {
    const result = loginSchema.safeParse({ username: 'partner_user', password: 'Password123!' });
    expect(result.success).toBe(true);
  });

  it('rejects short username or password', () => {
    const result = loginSchema.safeParse({ username: 'ab', password: '123' });
    expect(result.success).toBe(false);
  });

  it('validates support ticket schema', () => {
    const validTicket = ticketSchema.safeParse({
      subject: 'Hesap durumu inceleme',
      description: 'Lütfen güncel hesap durumum hakkında bilgi verin.',
    });
    expect(validTicket.success).toBe(true);
  });
});
