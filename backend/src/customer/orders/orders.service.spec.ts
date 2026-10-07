import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';

const validBody = {
  items: [{ productId: 'product-1', quantity: 1, price: 1 }],
  paymentMethod: 'ONLINE',
  firstName: 'Test',
  lastName: 'Customer',
  email: 'customer@example.test',
  phone: '0771234567',
  houseNumber: '10',
  laneStreet: 'Main Street',
  city: 'Colombo',
  district: 'Colombo',
};

function createService(productData: Record<string, unknown>) {
  const productRef = { id: 'product-1' };
  const productSnapshot = {
    exists: true,
    ref: productRef,
    data: () => productData,
  };
  const transaction = {
    get: jest.fn().mockResolvedValue(productSnapshot),
    update: jest.fn(),
    create: jest.fn(),
  };
  const orderRef = { id: 'order-doc-1' };
  const db = {
    collection: jest.fn((name: string) => {
      if (name === 'products') {
        return { doc: () => ({ get: jest.fn().mockResolvedValue(productSnapshot) }) };
      }
      return { doc: () => orderRef };
    }),
    runTransaction: jest.fn((callback: (value: typeof transaction) => unknown) => callback(transaction)),
  };
  const firebaseService = { getDb: () => db };
  const productsService = { isStorefrontCategory: jest.fn().mockResolvedValue(true) };
  return { service: new OrdersService(firebaseService as any, productsService as any), transaction };
}

describe('OrdersService.createOrder', () => {
  const user = { uid: 'customer-1', email: 'customer@example.test' };

  it('uses the Firestore price instead of the client-supplied price', async () => {
    const { service, transaction } = createService({
      name: 'Demo Laptop',
      price: 125000,
      stock: 4,
      status: 'active',
      category: 'Laptops',
    });

    const order = await service.createOrder(validBody, user);

    expect(order.items[0].price).toBe(125000);
    expect(order.totalAmount).toBe(125400);
    expect(transaction.create.mock.calls[0][1].items[0].price).toBe(125000);
  });

  it('rejects quantities above the current Firestore stock', async () => {
    const { service, transaction } = createService({
      name: 'Demo Laptop',
      price: 125000,
      stock: 0,
      status: 'active',
      category: 'Laptops',
    });

    await expect(
      service.createOrder({ ...validBody, items: [{ productId: 'product-1', quantity: 1 }] }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction.create).not.toHaveBeenCalled();
  });

  it('rejects draft products during order creation', async () => {
    const { service, transaction } = createService({
      name: 'Demo Laptop',
      price: 125000,
      stock: 4,
      status: 'draft',
      category: 'Laptops',
    });

    await expect(service.createOrder(validBody, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transaction.create).not.toHaveBeenCalled();
  });

  it('does not settle a cancelled cash-on-delivery order', async () => {
    const ref = { id: 'order-1' };
    const transaction = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          paymentMethod: 'COD',
          paymentStatus: 'cancelled',
          orderStatus: 'Cancelled',
        }),
      }),
      update: jest.fn(),
    };
    const db = {
      collection: jest.fn(() => ({ doc: jest.fn(() => ref) })),
      runTransaction: jest.fn((callback: (value: typeof transaction) => unknown) => callback(transaction)),
    };
    const service = new OrdersService({ getDb: () => db } as any, {} as any);

    await expect(service.settlePayment('order-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transaction.update).not.toHaveBeenCalled();
  });
});