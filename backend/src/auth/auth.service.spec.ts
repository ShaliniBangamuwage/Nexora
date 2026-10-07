import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

function createService(
  token: Record<string, unknown> = { uid: 'customer-1', email: 'customer@example.test' },
  records: Record<string, Record<string, unknown> | undefined> = {},
) {
  const refs = {
    admins: { path: 'admins/customer-1' },
    users: { path: 'users/customer-1' },
    customerCounter: { path: 'counters/customerId' },
  };
  const snapshots: Record<string, any> = {
    [refs.admins.path]: {
      exists: Boolean(records.admins),
      data: () => records.admins,
    },
    [refs.users.path]: {
      exists: Boolean(records.users),
      data: () => records.users,
    },
    [refs.customerCounter.path]: {
      exists: false,
      data: () => undefined,
    },
  };
  const transaction = {
    get: jest.fn(async (ref: { path: string }) => snapshots[ref.path]),
    set: jest.fn(),
  };
  const db = {
    doc: jest.fn(() => refs.customerCounter),
    collection: jest.fn((collection: 'admins' | 'users') => ({
      doc: jest.fn(() => ({
        ...refs[collection],
        get: jest.fn().mockResolvedValue(snapshots[refs[collection].path]),
      })),
    })),
    runTransaction: jest.fn((callback: (value: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  };
  const firebaseService = {
    getAdmin: () => ({ verifyIdToken: jest.fn().mockResolvedValue(token) }),
    getDb: () => db,
  };
  return { service: new AuthService(firebaseService as any), transaction };
}

describe('AuthService.resolveSession', () => {
  it('rejects requests without a Firebase bearer token', async () => {
    const { service } = createService();
    await expect(service.resolveSession(undefined, {})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('creates only the authenticated user profile and forces customer role', async () => {
    const { service, transaction } = createService(
      { uid: 'customer-1', email: 'customer@example.test' },
      { users: { role: 'admin', status: 'active' } },
    );

    const result = await service.resolveSession('Bearer valid-token', {
      fullName: 'New Customer',
    });

    expect(result.user.role).toBe('customer');
    expect(transaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/customer-1' }),
      expect.objectContaining({ role: 'customer', status: 'active', customerId: 'C001' }),
      { merge: true },
    );
  });

  it('rejects an admin profile without a verified admin claim', async () => {
    const { service } = createService(
      { uid: 'customer-1', email: 'customer@example.test' },
      { admins: { role: 'admin', status: 'active' } },
    );

    await expect(
      service.resolveSession('Bearer customer-token', {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns an admin session only with a verified claim and active admin record', async () => {
    const { service, transaction } = createService(
      { uid: 'customer-1', email: 'admin@example.test', role: 'admin' },
      { admins: { role: 'admin', status: 'active', fullName: 'Store Admin' } },
    );

    const result = await service.resolveSession('Bearer admin-token', {});

    expect(result.user.role).toBe('admin');
    expect(transaction.set).not.toHaveBeenCalled();
  });
});
