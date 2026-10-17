import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('SQL Schema & Grant Admin Function Tests', () => {
  const schemaPath = path.resolve(__dirname, '../../supabase/schema.sql');
  const grantAdminPath = path.resolve(__dirname, '../../supabase/grant_admin.sql');
  const migrationPath = path.resolve(__dirname, '../../supabase/migrations/20250222000001_fix_admin_username_login_and_partner_lookup.sql');

  it('verifies schema.sql exists and contains grant_admin_role definition with target_email TEXT', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    expect(schemaContent).toContain('CREATE OR REPLACE FUNCTION public.grant_admin_role(target_email TEXT)');
    expect(schemaContent).toContain('SECURITY DEFINER');
    expect(schemaContent).toContain('search_path = public, auth');
  });

  it('verifies schema.sql contains security checks and permission revokes', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    expect(schemaContent).toContain('IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN');
    expect(schemaContent).toContain('REVOKE EXECUTE ON FUNCTION public.grant_admin_role(TEXT) FROM PUBLIC, anon, authenticated;');
    expect(schemaContent).toContain('GRANT EXECUTE ON FUNCTION public.grant_admin_role(TEXT) TO service_role, postgres;');
  });

  it('verifies grant_admin.sql is clean and free of Git merge conflict residue', () => {
    const grantAdminContent = fs.readFileSync(grantAdminPath, 'utf-8');
    expect(grantAdminContent).toContain('CREATE OR REPLACE FUNCTION public.grant_admin_role(target_email TEXT)');
    expect(grantAdminContent).toContain('REVOKE EXECUTE ON FUNCTION public.grant_admin_role(TEXT) FROM PUBLIC, anon, authenticated;');
    expect(grantAdminContent).toContain("SELECT public.grant_admin_role('destek@eternalproduction.net');");

    // Ensure no Git merge conflict markers exist as standalone lines or unresolved markers
    expect(grantAdminContent).not.toContain('<<<<<<<');
    expect(grantAdminContent).not.toContain('>>>>>>>');
    expect(grantAdminContent).not.toMatch(/^=======$/m);
    expect(grantAdminContent).not.toContain('fix/grant-admin-role-sql-');
  });

  it('verifies get_partner_auth_email_by_username function handles admin username lookup when partners table is empty', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    expect(schemaContent).toContain('CREATE OR REPLACE FUNCTION public.get_partner_auth_email_by_username(p_username TEXT)');
    expect(schemaContent).toContain('FROM auth.users au');
    expect(schemaContent).toContain('LEFT JOIN public.user_roles ur ON ur.user_id = au.id');
    expect(schemaContent).toContain("ur.role = 'admin'");
  });

  it('verifies new migration file exists and safely updates get_partner_auth_email_by_username', () => {
    const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(migrationContent).toContain('CREATE OR REPLACE FUNCTION public.get_partner_auth_email_by_username(p_username TEXT)');
    expect(migrationContent).toContain('LEFT JOIN public.user_roles ur ON ur.user_id = au.id');
    expect(migrationContent).not.toMatch(/DROP\s+TABLE/i);
  });

  it('ensures no destructive table or data deletion commands exist in SQL files', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const grantAdminContent = fs.readFileSync(grantAdminPath, 'utf-8');

    expect(schemaContent).not.toMatch(/DROP\s+TABLE/i);
    expect(schemaContent).not.toMatch(/TRUNCATE\s+TABLE/i);
    expect(grantAdminContent).not.toMatch(/DROP\s+TABLE/i);
    expect(grantAdminContent).not.toMatch(/TRUNCATE\s+TABLE/i);
  });
});
