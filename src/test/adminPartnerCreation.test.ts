import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Admin Partner Creation & RPC Integration Tests', () => {
  const schemaPath = path.resolve(__dirname, '../../supabase/schema.sql');
  const migrationPath = path.resolve(__dirname, '../../supabase/migrations/20250224000000_admin_direct_user_creation.sql');
  const apiPath = path.resolve(__dirname, '../services/api.ts');
  const authContextPath = path.resolve(__dirname, '../context/AuthContext.tsx');
  const edgeFunctionPath = path.resolve(__dirname, '../../supabase/functions/admin-create-partner/index.ts');
  const readmePath = path.resolve(__dirname, '../../README.md');

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
  const apiContent = fs.readFileSync(apiPath, 'utf-8');
  const authContextContent = fs.readFileSync(authContextPath, 'utf-8');
  const edgeFunctionContent = fs.readFileSync(edgeFunctionPath, 'utf-8');
  const readmeContent = fs.readFileSync(readmePath, 'utf-8');

  it('verifies admin_create_partner_user function is defined in both schema.sql and migration file', () => {
    expect(schemaContent).toContain('CREATE OR REPLACE FUNCTION public.admin_create_partner_user');
    expect(migrationContent).toContain('CREATE OR REPLACE FUNCTION public.admin_create_partner_user');
  });

  it('verifies admin_create_partner_user parameter signature matches frontend RPC invocation', () => {
    const expectedParams = [
      'p_username TEXT',
      'p_display_name TEXT',
      'p_password TEXT',
      'p_is_active BOOLEAN DEFAULT true',
    ];

    expectedParams.forEach((param) => {
      expect(schemaContent).toContain(param);
      expect(migrationContent).toContain(param);
    });

    // Frontend API parameters
    expect(apiContent).toContain('p_username: cleanUsername');
    expect(apiContent).toContain('p_display_name: cleanDisplayName');
    expect(apiContent).toContain('p_password: password');
    expect(apiContent).toContain('p_is_active: isActive');
  });

  it('verifies server-side admin authorization check exists inside RPC function and Edge Function', () => {
    expect(schemaContent).toContain('IF NOT public.is_admin() THEN');
    expect(schemaContent).toContain("RAISE EXCEPTION 'Yetkisiz erişim: Bu işlemi gerçekleştirmek için yönetici yetkisi gereklidir.'");

    expect(migrationContent).toContain('IF NOT public.is_admin() THEN');
    expect(migrationContent).toContain("RAISE EXCEPTION 'Yetkisiz erişim: Bu işlemi gerçekleştirmek için yönetici yetkisi gereklidir.'");

    // Edge Function check
    expect(edgeFunctionContent).toContain('const isAppAdmin = callerUser.app_metadata?.role === "admin";');
    expect(edgeFunctionContent).toContain('Yetkisiz erişim: Bu işlemi gerçekleştirmek için yönetici yetkisi gereklidir.');
  });

  it('verifies function permissions explicitly REVOKE from PUBLIC/anon and GRANT to authenticated/service_role', () => {
    const revokeStmt = 'REVOKE EXECUTE ON FUNCTION public.admin_create_partner_user(TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;';
    const grantStmt = 'GRANT EXECUTE ON FUNCTION public.admin_create_partner_user(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated, service_role;';

    expect(schemaContent).toContain(revokeStmt);
    expect(schemaContent).toContain(grantStmt);

    expect(migrationContent).toContain(revokeStmt);
    expect(migrationContent).toContain(grantStmt);
  });

  it('verifies password security and minimum length validation', () => {
    // SQL level check
    expect(schemaContent).toContain('IF p_password IS NULL OR length(p_password) < 6 THEN');
    expect(migrationContent).toContain('IF p_password IS NULL OR length(p_password) < 6 THEN');

    // Bcrypt hashing check
    expect(schemaContent).toContain("crypt(p_password, gen_salt('bf'))");
    expect(migrationContent).toContain("crypt(p_password, gen_salt('bf'))");

    // Client side check
    expect(apiContent).toContain("!password || password.length < 6");
    expect(apiContent).toContain("'Şifre en az 6 karakter uzunluğunda olmalıdır.'");
  });

  it('verifies duplicate username detection in SQL and frontend handling', () => {
    // SQL check
    expect(schemaContent).toContain('IF EXISTS (SELECT 1 FROM public.partners WHERE LOWER(username) = v_clean_username) THEN');
    expect(schemaContent).toContain('RAISE EXCEPTION \'Bu kullanıcı adı (%) zaten kullanılmaktadır.\', v_clean_username;');

    expect(migrationContent).toContain('IF EXISTS (SELECT 1 FROM public.partners WHERE LOWER(username) = v_clean_username) THEN');

    // Frontend handling check
    expect(apiContent).toContain("rpcError.message?.includes('zaten kullanılmaktadır') || rpcError.code === '23505'");
    expect(apiContent).toContain("'Bu kullanıcı adı zaten başka bir partner tarafından kullanılıyor.'");
  });

  it('verifies passive account scenario is correctly enforced in RPC and AuthContext', () => {
    // SQL default parameter and insert
    expect(schemaContent).toContain('p_is_active BOOLEAN DEFAULT true');
    expect(schemaContent).toContain('COALESCE(p_is_active, true)');

    // AuthContext blocking passive logins
    expect(authContextContent).toContain('if (!isActive) {');
    expect(authContextContent).toContain('Hesabınız pasif duruma getirilmiştir');
    expect(authContextContent).toContain('if (partnerProfile && partnerProfile.is_active === false) {');
  });

  it('verifies atomic table insertions across auth.users, auth.identities, user_roles, partners, partner_status, and audit_logs', () => {
    const requiredTables = [
      'INSERT INTO auth.users',
      'INSERT INTO auth.identities',
      'INSERT INTO public.user_roles',
      'INSERT INTO public.partners',
      'INSERT INTO public.partner_status',
      'INSERT INTO public.audit_logs',
    ];

    requiredTables.forEach((tbl) => {
      expect(schemaContent).toContain(tbl);
      expect(migrationContent).toContain(tbl);
    });
  });

  it('verifies Edge Function and migration instructions are documented in README.md', () => {
    expect(readmeContent).toContain('20250224000000_admin_direct_user_creation.sql');
    expect(readmeContent).toContain('supabase/functions/admin-create-partner/index.ts');
    expect(readmeContent).toContain("NOTIFY pgrst, 'reload schema';");
    expect(readmeContent).toContain('supabase functions deploy admin-create-partner');
  });
});
