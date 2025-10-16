import request from 'supertest';
import type { Application } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';

import { createApp } from '../../../app';
import PurchaseOrder from '../../../models/PurchaseOrder';
import {
  createApiResponseSchema,
  apiErrorResponseSchema,
} from '@pharmacy-pos/shared/schemas/zod/common';
import {
  purchaseOrderSummaryListSchema,
  purchaseOrderDetailSchema,
} from '@pharmacy-pos/shared/schemas/purchase-orders';
import BaseProduct from '../../../models/BaseProduct';
import { ProductType } from '@pharmacy-pos/shared/enums';

const purchaseOrderSummaryEnvelopeSchema = createApiResponseSchema(purchaseOrderSummaryListSchema)
  .extend({ message: z.string().optional() })
  .passthrough();

const purchaseOrderDetailEnvelopeSchema = createApiResponseSchema(purchaseOrderDetailSchema)
  .extend({ message: z.string().optional() })
  .passthrough();

const errorEnvelopeSchema = apiErrorResponseSchema
  .extend({ statusCode: z.number().optional() })
  .passthrough();

const seedPurchaseOrder = async () => {
  const identifier = `PO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const product = await BaseProduct.create({
    code: identifier,
    name: `Seed product ${identifier}`,
    productType: ProductType.PRODUCT,
    purchasePrice: 250,
    sellingPrice: 300,
  });

  return await PurchaseOrder.create({
    poid: identifier,
    orderNumber: identifier,
    pobill: `${identifier}-INV`,
    pobilldate: new Date('2024-01-01T00:00:00.000Z'),
    posupplier: 'Acme Pharma',
    supplier: new Types.ObjectId(),
    organizationId: new Types.ObjectId(),
    items: [
      {
        product: product._id,
        did: 'SKU-1001',
        dname: 'Vitamin C 500mg',
        dquantity: 10,
        dtotalCost: 2500,
        unitPrice: 250,
      },
    ],
    totalAmount: 2500,
    status: 'pending',
    notes: 'Seed purchase order for contract test',
  });
};

const parseEnvelope = <T>(schema: z.ZodSchema<T>, body: unknown): T => {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error(
      'Envelope validation failed: ' + JSON.stringify(result.error.issues, null, 2),
    );
  }
  return result.data;
};

describe('purchaseOrdersContract router', () => {
  let app: Application;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    app = createApp();
  });

  it('lists purchase orders using the shared summary schema', async () => {
    const seeded = await seedPurchaseOrder();

    const response = await request(app).get('/api/purchase-orders').expect(200);

    const envelope = parseEnvelope(purchaseOrderSummaryEnvelopeSchema, response.body);

    expect(envelope.success).toBe(true);
    expect(Array.isArray(envelope.data)).toBe(true);
    expect(envelope.data!.length).toBeGreaterThanOrEqual(1);

    const first = envelope.data!.find((entry) => entry._id === seeded._id.toString());
    expect(first).toBeDefined();
    expect(first?.poid).toBe(seeded.poid);
    expect(first?.items?.[0]?.dname).toBe('Vitamin C 500mg');
  });

  it('retrieves purchase order details using the shared detail schema', async () => {
    const seeded = await seedPurchaseOrder();

    const response = await request(app)
      .get(`/api/purchase-orders/${seeded._id.toString()}`)
      .expect(200);

    const envelope = parseEnvelope(purchaseOrderDetailEnvelopeSchema, response.body);

    expect(envelope.success).toBe(true);
    expect(envelope.data?._id).toBe(seeded._id.toString());
    expect(envelope.data?.items?.length).toBeGreaterThan(0);
    expect(envelope.data?.items?.[0]?.product).toBeDefined();
  });

  it('returns a 404 contract envelope for unknown purchase orders', async () => {
    const response = await request(app)
      .get('/api/purchase-orders/507f1f77bcf86cd799439011')
      .expect(404);

    const envelope = parseEnvelope(errorEnvelopeSchema, response.body);

    expect(envelope.success).toBe(false);
    expect(envelope.statusCode).toBe(404);
  });
});
