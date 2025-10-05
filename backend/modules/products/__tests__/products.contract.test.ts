import request from 'supertest';
import type { Application } from 'express';
import { z } from 'zod';

import BaseProduct from '../../../models/BaseProduct';
import { createApp } from '../../../app';
import {
  basePackageUnits,
  invalidProductCreatePayloads,
  invalidProductQueryPayloads,
  validNonMedicineCreatePayload,
} from '@pharmacy-pos/shared/testing/products';
import { productSchema, productPackageUnitSchema } from '@pharmacy-pos/shared/schemas/zod/product';
import {
  apiSuccessEnvelopeSchema,
  createApiResponseSchema,
  apiErrorResponseSchema,
  timestampSchema,
} from '@pharmacy-pos/shared/schemas/zod/common';
import { zodId } from '@pharmacy-pos/shared/utils/zodUtils';

const nullableReferenceSchema = z
  .union([
    zodId,
    z.object({ _id: zodId.optional(), name: z.string().optional() }).passthrough(),
    z.null(),
  ])
  .optional();

const productContractSchema = productSchema
  .extend({
    supplier: nullableReferenceSchema,
    category: nullableReferenceSchema,
    packageUnits: z
      .array(
        productPackageUnitSchema
          .extend({
            effectiveFrom: timestampSchema.nullable().optional(),
            effectiveTo: timestampSchema.nullable().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

const productEnvelopeSchema = createApiResponseSchema(productContractSchema)
  .extend({
    message: z.string().optional(),
  })
  .passthrough();

const productListEnvelopeSchema = apiSuccessEnvelopeSchema
  .extend({
    message: z.string().optional(),
    data: z.array(productContractSchema),
    filters: z.record(z.unknown()).optional(),
    count: z.number().optional(),
  })
  .passthrough();

const errorEnvelopeSchema = apiErrorResponseSchema
  .extend({
    statusCode: z.number(),
  })
  .passthrough();

const validationErrorSchema = z
  .object({
    message: z.string().optional(),
    issues: z
      .array(
        z.object({
          code: z.string(),
          message: z.string().optional(),
          path: z.array(z.union([z.string(), z.number()])),
        }),
      )
      .nonempty(),
  })
  .passthrough();

const parseEnvelope = <T>(schema: z.ZodSchema<T>, body: unknown): T => {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new Error(`Envelope validation failed: ${JSON.stringify(result.error.issues, null, 2)}`);
  }

  return result.data;
};

const expectValidationIssues = (body: unknown) => {
  const result = validationErrorSchema.safeParse(body);
  if (!result.success) {
    throw new Error(`Validation error response mismatch: ${JSON.stringify(result.error.issues, null, 2)}`);
  }
  return result.data;
};

describe('productsContract router (feature flag enabled)', () => {
  let app: Application;

  beforeAll(() => {
    process.env.FEATURE_PRODUCTS_CONTRACT = 'true';
    process.env.NODE_ENV = 'test';
    app = createApp();
  });

  afterAll(() => {
    delete process.env.FEATURE_PRODUCTS_CONTRACT;
  });

  it('creates a product and returns SSOT-compliant envelope', async () => {
    const payload = {
      ...validNonMedicineCreatePayload,
      code: 'PRD-CONTRACT-001',
      name: 'Contract Product',
    };

    const response = await request(app)
      .post('/api/products/product')
      .send(payload)
      .expect(201);

    const envelope = parseEnvelope(productEnvelopeSchema, response.body);

    expect(envelope.success).toBe(true);
    expect(envelope.data).toMatchObject({
      code: 'PRD-CONTRACT-001',
      name: 'Contract Product',
      productType: 'product',
    });
    expect(new Date(envelope.timestamp ?? new Date()).toString()).not.toBe('Invalid Date');
  });

  it('rejects duplicate codes with contract error envelope', async () => {
    const payload = {
      ...validNonMedicineCreatePayload,
      code: 'PRD-CONTRACT-409',
      name: 'Duplicate Product',
    };

    await request(app).post('/api/products/product').send(payload).expect(201);

    const duplicate = await request(app)
      .post('/api/products/product')
      .send(payload)
      .expect(409);

    const envelope = parseEnvelope(errorEnvelopeSchema, duplicate.body);
    expect(envelope.statusCode).toBe(409);
    expect(envelope.success).toBe(false);
    expect(envelope.message).toBeDefined();
  });

  it('lists products with envelope metadata and shared schema compliance', async () => {
    await BaseProduct.create({
      code: 'PRD-CONTRACT-LIST',
      name: 'List Product',
      unit: 'box',
      productType: 'product',
      isActive: true,
      packageUnits: basePackageUnits,
    });

    const response = await request(app).get('/api/products').expect(200);

    const envelope = parseEnvelope(productListEnvelopeSchema, response.body);

    expect(Array.isArray(envelope.data)).toBe(true);
    expect(envelope.data.length).toBeGreaterThanOrEqual(1);
    expect(envelope.filters).toBeDefined();
    expect(envelope.count).toBeGreaterThanOrEqual(envelope.data.length);
  });

  it('updates and deletes a product while preserving shared envelopes', async () => {
    const createResponse = await request(app)
      .post('/api/products/product')
      .send({
        ...validNonMedicineCreatePayload,
        code: 'PRD-CONTRACT-UPDATE',
        name: 'Updatable Product',
      })
      .expect(201);

    const createdEnvelope = parseEnvelope(productEnvelopeSchema, createResponse.body);
    const productId = createdEnvelope.data?._id as string;

    const updateResponse = await request(app)
      .put(`/api/products/${productId}`)
      .send({ name: 'Updated Product', packageUnits: [] })
      .expect(200);

    const updatedEnvelope = parseEnvelope(productEnvelopeSchema, updateResponse.body);
    expect(updatedEnvelope.data).toMatchObject({ name: 'Updated Product' });

    const deleteResponse = await request(app)
      .delete(`/api/products/${productId}`)
      .expect(200);

    const deletedEnvelope = parseEnvelope(productEnvelopeSchema, deleteResponse.body);
    expect(deletedEnvelope.data).toMatchObject({ isActive: false });
  });

  it('rejects invalid payloads based on shared schema definitions', async () => {
    const invalidPayloads = invalidProductCreatePayloads.slice(0, 4);

    for (const payload of invalidPayloads) {
      const response = await request(app).post('/api/products/product').send(payload).expect(400);
      const errorBody = expectValidationIssues(response.body);
      if (errorBody.message) {
        expect(errorBody.message.toLowerCase()).toContain('invalid');
      }
    }
  });

  it('rejects invalid query parameters using shared validators', async () => {
    for (const query of invalidProductQueryPayloads) {
      const response = await request(app).get('/api/products').query(query).expect(400);
      expectValidationIssues(response.body);
    }
  });

  it('returns 404 envelope for missing product id', async () => {
    const response = await request(app).get('/api/products/64b27b65f1f1f1f1f1f1f1f1').expect(404);
    const envelope = parseEnvelope(errorEnvelopeSchema, response.body);
    expect(envelope.statusCode).toBe(404);
  });
});
