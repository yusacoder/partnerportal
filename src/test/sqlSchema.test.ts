import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('SQL Schema & Security Policy Integration Tests', () => {
  const schemaPath = path.resolve(__dirname, '../../supabase/schema.sql');
  const grantAdminPath = path.resolve(__dirname, '../../supabase/grant_admin.sql');
  const migrationPath = path.resolve(__dirname, '../../supabase/migrations/20250222000000_fix_admin_login_and_roles.sql');

  it('verifies schema.sql exists and contains grant_admin_role definition with target_email TEXT', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    expect(schemaContent).toContain('CREATE OR REPLACE FUNCTION public.grant_admin_role(target_email TEXT)');
    expect(schemaContent).toContain('SECURITY DEFINER');
    expect(schemaContent).toContain("search_path = public, auth");
  });

  it('verifies schema.sql contains security checks and permission revokes', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    expect(schemaContent).toContain('IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN');
    expect(schemaContent).toContain('REVOKE EXECUTE ON FUNCTION public.grant_admin_role(TEXT) FROM PUBLIC, anon, authenticated;');
    expect(schemaContent).toContain('GRANT EXECUTE ON FUNCTION public.grant_admin_role(TEXT) TO service_role, postgres;');
  });

  it('verifies grant_admin.sql is clean without git conflict markers and defines grant_admin_role', () => {
    const grantAdminContent = fs.readFileSync(grantAdminPath, 'utf-8');
    expect(grantAdminContent).not.toMatch(/^<<<<<<</m);
    expect(grantAdminContent).not.toMatch(/^=======$/m);
    expect(grantAdminContent).not.toMatch(/^>>>>>>>/m);
    expect(grantAdminContent).toContain('CREATE OR REPLACE FUNCTION public.grant_admin_role(target_email TEXT)');
    expect(grantAdminContent).toContain('REVOKE EXECUTE ON FUNCTION public.grant_admin_role(TEXT) FROM PUBLIC, anon, authenticated;');
    expect(grantAdminContent).toContain("SELECT public.grant_admin_role('destek@eternalproduction.net');");
  });

  it('verifies get_partner_auth_email_by_username supports both partners and admin auth emails', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    expect(schemaContent).toContain('CREATE OR REPLACE FUNCTION public.get_partner_auth_email_by_username');
    expect(schemaContent).toContain('FROM public.partners p');
    expect(schemaContent).toContain('FROM auth.users au');
    expect(schemaContent).toContain("LOWER(split_part(au.email, '@', 1)) = LOWER(TRIM(p_username))");
  });

  it('verifies get_partner_by_invite_token and claim_partner_invite RPC definitions exist', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    expect(schemaContent).toContain('CREATE OR REPLACE FUNCTION public.get_partner_by_invite_token');
    expect(schemaContent).toContain('CREATE OR REPLACE FUNCTION public.claim_partner_invite');
    expect(schemaContent).toContain('SECURITY DEFINER SET search_path = public, auth');
  });

  it('verifies announcements RLS policy properly casts target_partner_ids to prevent type errors', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    expect(schemaContent).toContain('id::text = ANY(target_partner_ids)');
  });

  it('ensures no destructive table or data deletion commands exist in SQL files', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const grantAdminContent = fs.readFileSync(grantAdminPath, 'utf-8');
    const migrationContent = fs.readFileSync(migrationPath, 'utf-8');

    expect(schemaContent).not.toMatch(/DROP\s+TABLE/i);
    expect(schemaContent).not.toMatch(/TRUNCATE\s+TABLE/i);
    expect(grantAdminContent).not.toMatch(/DROP\s+TABLE/i);
    expect(grantAdminContent).not.toMatch(/TRUNCATE\s+TABLE/i);
    expect(migrationContent).not.toMatch(/DROP\s+TABLE/i);
  });
});
