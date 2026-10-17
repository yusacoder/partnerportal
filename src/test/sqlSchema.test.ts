import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('SQL Schema & Grant Admin Function Tests', () => {
  const schemaPath = path.resolve(__dirname, '../../supabase/schema.sql');
  const grantAdminPath = path.resolve(__dirname, '../../supabase/grant_admin.sql');

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

  it('verifies grant_admin.sql is self-contained and defines grant_admin_role before executing', () => {
    const grantAdminContent = fs.readFileSync(grantAdminPath, 'utf-8');
    expect(grantAdminContent).toContain('CREATE OR REPLACE FUNCTION public.grant_admin_role(target_email TEXT)');
    expect(grantAdminContent).toContain('REVOKE EXECUTE ON FUNCTION public.grant_admin_role(TEXT) FROM PUBLIC, anon, authenticated;');
    expect(grantAdminContent).toContain("SELECT public.grant_admin_role('destek@eternalproduction.net');");
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
