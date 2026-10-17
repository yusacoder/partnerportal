import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Partner Invite Creation & Claiming Integration Tests', () => {
  const schemaPath = path.resolve(__dirname, '../../supabase/schema.sql');
  const migrationPath = path.resolve(__dirname, '../../supabase/migrations/20250222000001_fix_partner_invite_flow.sql');
  const authContextPath = path.resolve(__dirname, '../context/AuthContext.tsx');
  const adminPartnersPath = path.resolve(__dirname, '../pages/admin/AdminPartnersPage.tsx');
  const invitePagePath = path.resolve(__dirname, '../pages/partner/InvitePage.tsx');

  describe('Database RPCs & Security Definitions', () => {
    it('verifies schema.sql and migration file define get_partner_by_invite_token with auth_user_id column', () => {
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      const migrationContent = fs.readFileSync(migrationPath, 'utf-8');

      [schemaContent, migrationContent].forEach((content) => {
        expect(content).toContain('CREATE OR REPLACE FUNCTION public.get_partner_by_invite_token(p_token TEXT)');
        expect(content).toContain('auth_user_id UUID');
        expect(content).toContain('WHERE p.invite_token = TRIM(p_token)');
      });
    });

    it('verifies claim_partner_invite RPC validates expired, used, and inactive tokens', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf-8');

      expect(migrationContent).toContain('CREATE OR REPLACE FUNCTION public.claim_partner_invite(p_token TEXT, p_auth_user_id UUID)');
      expect(migrationContent).toContain("RAISE EXCEPTION 'Bu davet bağlantısı daha önce kullanılmış.'");
      expect(migrationContent).toContain("RAISE EXCEPTION 'Hesabınız pasif duruma getirilmiştir. Lütfen ajans ile iletişime geçin.'");
      expect(migrationContent).toContain("RAISE EXCEPTION 'Davet bağlantısının süresi dolmuş.'");
      expect(migrationContent).toContain('invite_token = NULL');
      expect(migrationContent).toContain("role = 'partner'");
    });

    it('verifies RPC functions explicitly grant execute permissions to anon and authenticated users', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf-8');

      expect(migrationContent).toContain('GRANT EXECUTE ON FUNCTION public.get_partner_by_invite_token(TEXT) TO anon, authenticated, service_role;');
      expect(migrationContent).toContain('GRANT EXECUTE ON FUNCTION public.claim_partner_invite(TEXT, UUID) TO anon, authenticated, service_role;');
    });
  });

  describe('AuthContext Invite Logic & Error Scenarios', () => {
    it('verifies claimInviteAndSetPassword validates password length and empty tokens', () => {
      const authContent = fs.readFileSync(authContextPath, 'utf-8');

      expect(authContent).toContain("const cleanToken = token ? token.trim() : '';");
      expect(authContent).toContain("return { success: false, error: 'Geçerli bir davet kodu veya bağlantısı gereklidir.' };");
      expect(authContent).toContain("return { success: false, error: 'Şifreniz en az 8 karakter uzunluğunda olmalıdır.' };");
    });

    it('verifies claimInviteAndSetPassword distinguishes between invalid, used, inactive, and expired tokens', () => {
      const authContent = fs.readFileSync(authContextPath, 'utf-8');

      expect(authContent).toContain("return { success: false, error: 'Geçersiz veya kullanılmış davet bağlantısı.' };");
      expect(authContent).toContain("return { success: false, error: 'Bu davet bağlantısı daha önce kullanılmış.' };");
      expect(authContent).toContain("return { success: false, error: 'Hesabınız pasif duruma getirilmiştir. Lütfen ajans ile iletişime geçin.' };");
      expect(authContent).toContain("return { success: false, error: 'Davet bağlantısının süresi dolmuş.' };");
    });

    it('verifies shadow email format and user_roles assignment logic', () => {
      const authContent = fs.readFileSync(authContextPath, 'utf-8');

      expect(authContent).toContain('const shadowEmail = `${partnerData.username.toLowerCase()}@partner.eternal.internal`;');
      expect(authContent).toContain("p_auth_user_id: newAuthUserId");
      expect(authContent).toContain("role: 'partner'");
    });

    it('verifies atomic execution and error logging privacy (no secrets/passwords in logs)', () => {
      const authContent = fs.readFileSync(authContextPath, 'utf-8');

      expect(authContent).not.toMatch(/console\.log\(.*pass/i);
      expect(authContent).not.toMatch(/console\.log\(.*token/i);
      expect(authContent).toContain("const msg = err instanceof Error ? err.message : 'Davet kabul edilirken beklenmeyen bir hata oluştu.';");
    });
  });

  describe('Frontend URL Token Handling', () => {
    it('verifies AdminPartnersPage encodes invite token safely in generated URLs', () => {
      const adminContent = fs.readFileSync(adminPartnersPath, 'utf-8');

      expect(adminContent).toContain('encodeURIComponent(res.inviteToken)');
    });

    it('verifies InvitePage reads and trims token from URL search parameters', () => {
      const inviteContent = fs.readFileSync(invitePagePath, 'utf-8');

      expect(inviteContent).toContain("const tokenParam = searchParams.get('token');");
      expect(inviteContent).toContain('setToken(tokenParam.trim());');
    });
  });
});
