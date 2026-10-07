import { UnauthorizedException } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';

describe('FirebaseAuthGuard', () => {
  const makeContext = (request: any) =>
    ({ switchToHttp: () => ({ getRequest: () => request }) }) as any;

  const createGuard = (
    decodedToken: Record<string, unknown>,
    accountRecords: Record<string, Record<string, unknown> | undefined> = {},
  ) => {
    const records: Record<string, Record<string, unknown> | undefined> = {
      users: { role: 'admin', status: 'active' },
      admins: undefined,
      ...accountRecords,
    };
    const db = {
      collection: jest.fn((name: string) => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: Boolean(records[name]),
            data: () => records[name],
          }),
        })),
      })),
    };
    const firebaseService = {
      getAdmin: () => ({ verifyIdToken: jest.fn().mockResolvedValue(decodedToken) }),
      getDb: () => db,
    };

    return new FirebaseAuthGuard(firebaseService as any);
  };

  it('does not promote a user profile role to admin', async () => {
    const request: any = { headers: { authorization: 'Bearer test-token' } };
    const guard = createGuard({ uid: 'customer-1', email: 'customer@example.test' });

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(request.user.role).toBe('customer');
  });

  it('rejects an admin token without a matching admin record', async () => {
    const request = { headers: { authorization: 'Bearer test-token' } };
    const guard = createGuard({ uid: 'customer-1', role: 'admin' });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('accepts a verified admin claim with an active admin record', async () => {
    const request: any = { headers: { authorization: 'Bearer test-token' } };
    const guard = createGuard(
      { uid: 'admin-1', role: 'admin' },
      { users: undefined, admins: { role: 'admin', status: 'active' } },
    );

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(request.user.role).toBe('admin');
  });
});