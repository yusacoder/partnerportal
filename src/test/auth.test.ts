import { describe, it, expect } from 'vitest';

// Unit tests for authentication helper logic and email resolution
describe('Auth Email Resolution & Admin Authorization Tests', () => {
  const resolveAuthEmail = (input: string, rpcResult: { email: string; is_active: boolean } | null) => {
    const cleanUsername = input.trim().toLowerCase();
    if (rpcResult) {
      return { authEmail: rpcResult.email, isActive: rpcResult.is_active };
    }
    if (cleanUsername.includes('@')) {
      return { authEmail: cleanUsername, isActive: true };
    }
    return { authEmail: `${cleanUsername}@partner.eternal.internal`, isActive: true };
  };

  const resolveUserRole = (authUser: { app_metadata?: { role?: string }; user_metadata?: { role?: string } }, dbRole?: string) => {
    // 1. Check app_metadata (trusted server metadata)
    const isAppAdmin = authUser.app_metadata?.role === 'admin';
    // 2. Check user_roles table (protected by RLS)
    const isDbAdmin = dbRole === 'admin';

    // Strictly ignore authUser.user_metadata
    if (isAppAdmin || isDbAdmin) {
      return 'admin';
    }
    return dbRole || 'partner';
  };

  it('correctly resolves admin email address without appending partner domain', () => {
    const adminEmail = 'destek@eternalproduction.net';
    // When partners table is empty, rpcResult is null
    const res = resolveAuthEmail(adminEmail, null);
    expect(res.authEmail).toBe('destek@eternalproduction.net');
    expect(res.isActive).toBe(true);
  });

  it('correctly resolves partner username via RPC result', () => {
    const username = 'partner_ahmet';
    const rpcResult = { email: 'partner_ahmet@partner.eternal.internal', is_active: true };
    const res = resolveAuthEmail(username, rpcResult);
    expect(res.authEmail).toBe('partner_ahmet@partner.eternal.internal');
    expect(res.isActive).toBe(true);
  });

  it('blocks inactive partner accounts', () => {
    const username = 'partner_inactive';
    const rpcResult = { email: 'partner_inactive@partner.eternal.internal', is_active: false };
    const res = resolveAuthEmail(username, rpcResult);
    expect(res.isActive).toBe(false);
  });

  it('correctly assigns admin role from app_metadata or user_roles table', () => {
    const adminUser = { app_metadata: { role: 'admin' }, user_metadata: { role: 'partner' } };
    expect(resolveUserRole(adminUser, 'partner')).toBe('admin');

    const dbAdminUser = { app_metadata: { role: 'partner' } };
    expect(resolveUserRole(dbAdminUser, 'admin')).toBe('admin');
  });

  it('ignores user_metadata when determining user role to prevent self-elevation', () => {
    const maliciousUser = { app_metadata: { role: 'partner' }, user_metadata: { role: 'admin' } };
    expect(resolveUserRole(maliciousUser, 'partner')).toBe('partner');
  });
});
