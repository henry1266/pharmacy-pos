import request from 'supertest';
import type { Application } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';

import { createApp } from '../../../app';
import PurchaseOrder from '../../../models/PurchaseOrder';
import BaseProduct from '../../../models/BaseProduct';
import { ProductType } from '@pharmacy-pos/shared/enums';
import {
  purchaseOrderFilteredListResponseSchema,
  purchaseOrderMutationResponseSchema,
  purchaseOrderErrorSchema,
  purchaseOrderCreateInputSchema,
} from '@pharmacy-pos/shared/schemas/purchase-orders';

type SummaryEnvelope = z.infer<typeof purchaseOrderFilteredListResponseSchema>;
type DetailEnvelope = z.infer<typeof purchaseOrderMutationResponseSchema>;
type ErrorEnvelope = z.infer<typeof purchaseOrderErrorSchema>;

interface SeedOverrides {
  poid?: string;
  orderNumber?: string;
  supplier?: Types.ObjectId;
  product?: {
    code: string;
    name: string;
  };
  items?: Array<{
    product?: Types.ObjectId;
    did: string;
    dname: string;
    dquantity: number;
    dtotalCost: number;
    unitPrice?: number;
  }>;
  status?: string;
  totalAmount?: number;
}

const TEST_TOKEN = 'test-mode-token';

const parseEnvelope = <TSchema extends z.ZodTypeAny>(schema: TSchema, body: unknown) => {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error(`Envelope validation failed: ${JSON.stringify(result.error.issues, null, 2)}`);
  }
  return result.data;
};

const seedPurchaseOrder = async (overrides: SeedOverrides = {}) => {
  const identifier = overrides.poid ?? `PO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const productCode = overrides.product?.code ?? `SKU-${identifier}`;

  const product = await BaseProduct.create({
    code: productCode,
    name: overrides.product?.name ?? `Seed product ${identifier}`,
    productType: ProductType.PRODUCT,
    purchasePrice: 250,
    sellingPrice: 300,
  });

  const items = overrides.items ?? [
    {
      product: product._id,
      did: productCode,
      dname: overrides.product?.name ?? 'Vitamin C 500mg',
      dquantity: 10,
      dtotalCost: 2500,
      unitPrice: 250,
    },
  ];

  const order = await PurchaseOrder.create({
    poid: identifier,
    orderNumber: overrides.orderNumber ?? identifier,
    pobill: `${identifier}-INV`,
    pobilldate: new Date('2024-01-01T00:00:00.000Z'),
    posupplier: 'Acme Pharma',
    supplier: overrides.supplier ?? new Types.ObjectId(),
    organizationId: new Types.ObjectId(),
    items,
    totalAmount: overrides.totalAmount ?? items.reduce((sum, item) => sum + item.dtotalCost, 0),
    status: overrides.status ?? 'pending',
    notes: 'Seed purchase order for contract test',
  });

  return { order, product };
};

describe('purchaseOrdersContract router', () => {
  let app: Application;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.REACT_APP_TEST_MODE = 'true';
    app = createApp();
  });

  it('lists purchase orders using the shared summary schema', async () => {
    const { order } = await seedPurchaseOrder();

    const response = await request(app).get('/api/purchase-orders').expect(200);

    const envelope = parseEnvelope(purchaseOrderFilteredListResponseSchema, response.body) as SummaryEnvelope;

    expect(envelope.success).toBe(true);
    expect(Array.isArray(envelope.data)).toBe(true);
    const target = envelope.data?.find((entry) => entry?._id === order._id.toString());
    expect(target).toBeDefined();
    expect(target?.poid).toBe(order.poid);
  });

  it('retrieves purchase order details using the shared detail schema', async () => {
    const { order } = await seedPurchaseOrder();

    const response = await request(app)
      .get(`/api/purchase-orders/${order._id.toString()}`)
      .expect(200);

    const envelope = parseEnvelope(purchaseOrderMutationResponseSchema, response.body) as DetailEnvelope;

    expect(envelope.success).toBe(true);
    expect(envelope.data?._id).toBe(order._id.toString());
    expect(envelope.data?.items?.length).toBeGreaterThan(0);
  });

  it('returns a 404 contract envelope for unknown purchase orders', async () => {
    const response = await request(app)
      .get('/api/purchase-orders/507f1f77bcf86cd799439011')
      .expect(404);

    const envelope = parseEnvelope(purchaseOrderErrorSchema, response.body) as ErrorEnvelope;

    expect(envelope.success).toBe(false);
    expect(envelope.statusCode).toBe(404);
    expect(envelope.code).toBe('NOT_FOUND');
  });

  it('creates purchase orders via the contract client schema', async () => {
    const identifier = `PO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const productCode = `SKU-${identifier}`;

    await BaseProduct.create({
      code: productCode,
      name: `Create product ${identifier}`,
      productType: ProductType.PRODUCT,
      purchasePrice: 100,
      sellingPrice: 120,
    });

    const payload = purchaseOrderCreateInputSchema.parse({
      poid: identifier,
      posupplier: 'Create Supplier',
      items: [
        {
          did: productCode,
          dname: 'Create Item',
          dquantity: 5,
          dtotalCost: 500,
        },
      ],
      totalAmount: 500,
    });

    const response = await request(app)
      .post('/api/purchase-orders')
      .set('x-auth-token', TEST_TOKEN)
      .send(payload)
      .expect(200);

    const envelope = parseEnvelope(purchaseOrderMutationResponseSchema, response.body) as DetailEnvelope;

    expect(envelope.success).toBe(true);
    expect(envelope.data?.poid).toBe(identifier);
    expect(envelope.data?.items?.[0]?.dname).toBe('Create Item');
  });

  it('rejects duplicate purchase order creation with a conflict error envelope', async () => {
    const { order } = await seedPurchaseOrder();

    const payload = purchaseOrderCreateInputSchema.parse({
      poid: order.poid,
      posupplier: 'Duplicate Supplier',
      items: [
        {
          did: 'SKU-DUP',
          dname: 'Duplicate Item',
          dquantity: 2,
          dtotalCost: 200,
        },
      ],
      totalAmount: 200,
    });

    const response = await request(app)
      .post('/api/purchase-orders')
      .set('x-auth-token', TEST_TOKEN)
      .send(payload)
      .expect(409);

    const envelope = parseEnvelope(purchaseOrderErrorSchema, response.body) as ErrorEnvelope;

    expect(envelope.success).toBe(false);
    expect(envelope.statusCode).toBe(409);
    expect(envelope.code).toBe('CONFLICT');
  });

  it('lists recent purchase orders using the filtered endpoint', async () => {
    await seedPurchaseOrder();
    await seedPurchaseOrder();

    const response = await request(app)
      .get('/api/purchase-orders/recent?limit=1')
      .expect(200);

    const envelope = parseEnvelope(purchaseOrderFilteredListResponseSchema, response.body) as SummaryEnvelope;

    expect(envelope.success).toBe(true);
    expect(envelope.data?.length).toBe(1);
  });

  it('filters purchase orders by supplier', async () => {
    const supplierId = new Types.ObjectId();
    await seedPurchaseOrder({ supplier: supplierId });
    await seedPurchaseOrder();

    const response = await request(app)
      .get(`/api/purchase-orders/supplier/${supplierId.toString()}`)
      .expect(200);

    const envelope = parseEnvelope(purchaseOrderFilteredListResponseSchema, response.body) as SummaryEnvelope;

    expect(envelope.success).toBe(true);
    const expectedSupplierId = supplierId.toString();
    expect(envelope.data?.length).toBeGreaterThan(0);
    envelope.data?.forEach((entry) => {
      if (typeof entry?.supplier === 'string') {
        expect(entry.supplier).toBe(expectedSupplierId);
      } else if (entry?.supplier && typeof entry.supplier === 'object') {
        const supplierRecord = entry.supplier as Record<string, unknown>;
        expect(String(supplierRecord._id)).toBe(expectedSupplierId);
      }
    });
  });

  it('returns a typed error envelope when updating an unknown purchase order', async () => {
    const payload = {
      posupplier: 'Update Supplier',
      items: [
        {
          did: 'SKU-UPDATE',
          dname: 'Update Item',
          dquantity: 1,
          dtotalCost: 100,
        },
      ],
    };

    const response = await request(app)
      .put('/api/purchase-orders/507f1f77bcf86cd799439011')
      .set('x-auth-token', TEST_TOKEN)
      .send(payload)
      .expect(404);

    const envelope = parseEnvelope(purchaseOrderErrorSchema, response.body) as ErrorEnvelope;

    expect(envelope.success).toBe(false);
    expect(envelope.code).toBe('NOT_FOUND');
  });
});
