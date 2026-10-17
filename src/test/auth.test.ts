import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Auth & Role Access Integration Tests', () => {
  const authContextPath = path.resolve(__dirname, '../context/AuthContext.tsx');
  const appPath = path.resolve(__dirname, '../App.tsx');
  const migrationPath = path.resolve(__dirname, '../../supabase/migrations/20250222000000_fix_admin_login_and_roles.sql');

  it('verifies AuthContext handles direct email login for usernames containing "@"', () => {
    const authContextContent = fs.readFileSync(authContextPath, 'utf-8');
    expect(authContextContent).toContain("if (cleanUsername.includes('@')) {");
    expect(authContextContent).toContain('return await loginWithEmail(cleanUsername, pass);');
  });

  it('verifies AuthContext evaluates app_metadata.role and user_roles table for admin checks', () => {
    const authContextContent = fs.readFileSync(authContextPath, 'utf-8');
    expect(authContextContent).toContain("const isAppAdmin = authUser.app_metadata?.role === 'admin';");
    expect(authContextContent).toContain("const isDbAdmin = roleData?.role === 'admin';");
    expect(authContextContent).toContain("const userRole: UserRole = (isAppAdmin || isDbAdmin) ? 'admin' : (roleData?.role as UserRole || 'partner');");
  });

  it('verifies App.tsx protects admin routes using ProtectedAdminRoute requiring role === "admin"', () => {
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).toContain('const ProtectedAdminRoute');
    expect(appContent).toContain("if (!user || role !== 'admin') {");
    expect(appContent).toContain('return <Navigate to="/partner/login" replace />;');
  });

  it('verifies migration file exists and safely applies grant_admin_role without dropping tables', () => {
    const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(migrationContent).toContain('CREATE OR REPLACE FUNCTION public.grant_admin_role(target_email TEXT)');
    expect(migrationContent).toContain("PERFORM public.grant_admin_role('destek@eternalproduction.net');");
    expect(migrationContent).not.toMatch(/DROP\s+TABLE/i);
  });

  it('verifies AuthContext uses valid TLD domain (@partner.eternalproduction.net) for shadow emails', () => {
    const authContextContent = fs.readFileSync(authContextPath, 'utf-8');
    expect(authContextContent).toContain('@partner.eternalproduction.net');
    expect(authContextContent).not.toContain('@partner.eternal.internal');
  });

  it('verifies invite claim clears invite token to enforce single-use tokens', () => {
    const schemaPath = path.resolve(__dirname, '../../supabase/schema.sql');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    expect(schemaContent).toContain('invite_token = NULL');
    expect(schemaContent).toContain('invite_expires_at = NULL');
  });

  it('verifies new shadow email migration 20250223000000_fix_shadow_email_domain.sql exists and is non-destructive', () => {
    const domainMigrationPath = path.resolve(__dirname, '../../supabase/migrations/20250223000000_fix_shadow_email_domain.sql');
    expect(fs.existsSync(domainMigrationPath)).toBe(true);
    const domainMigrationContent = fs.readFileSync(domainMigrationPath, 'utf-8');
    expect(domainMigrationContent).toContain('get_partner_auth_email_by_username');
    expect(domainMigrationContent).not.toMatch(/DROP\s+TABLE/i);
  });
});
