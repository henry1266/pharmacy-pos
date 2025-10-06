import request from 'supertest';
import type { Application } from 'express';
import { z } from 'zod';

import { createApp } from '../../../app';
import { supplierEntitySchema } from '@pharmacy-pos/shared/schemas/zod/supplier';
import {
  createApiResponseSchema,
  apiErrorResponseSchema,
} from '@pharmacy-pos/shared/schemas/zod/common';

const supplierEnvelopeSchema = createApiResponseSchema(supplierEntitySchema)
  .extend({
    message: z.string().optional(),
  })
  .passthrough();

const supplierListEnvelopeSchema = createApiResponseSchema(z.array(supplierEntitySchema))
  .extend({
    message: z.string().optional(),
  })
  .passthrough();

const validationErrorDetailsSchema = z
  .object({
    location: z.string().optional(),
    path: z.string().optional(),
    message: z.string(),
  })
  .passthrough();

const defaultErrorDetailsSchema = (apiErrorResponseSchema.shape.errors as z.ZodOptional<z.ZodArray<z.ZodObject<any>>>).unwrap();

const errorEnvelopeSchema = apiErrorResponseSchema
  .omit({ errors: true })
  .extend({
    errors: z.union([
      defaultErrorDetailsSchema,
      z.array(validationErrorDetailsSchema),
    ]).optional(),
    statusCode: z.number().optional(),
  })
  .passthrough();

const parseEnvelope = <T>(schema: z.ZodSchema<T>, body: unknown): T => {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error(
      'Envelope validation failed: ' + JSON.stringify(result.error.issues, null, 2),
    );
  }
  return result.data;
};

const buildSupplierPayload = (overrides: Record<string, unknown> = {}) => ({
  name: `Supplier ${Math.random().toString(36).slice(2, 8)}`,
  phone: '0912345678',
  email: `supplier-${Math.random().toString(36).slice(2, 8)}@example.com`,
  address: '123 Pharma St',
  contactPerson: 'Alice',
  notes: 'Test supplier',
  ...overrides,
});

describe('suppliersContract router', () => {
  let app: Application;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    app = createApp();
  });

  it('creates a supplier and returns SSOT-compliant envelope', async () => {
    const payload = buildSupplierPayload();

    const response = await request(app).post('/api/suppliers').send(payload).expect(200);

    const envelope = parseEnvelope(supplierEnvelopeSchema, response.body);

    expect(envelope.success).toBe(true);
    const data = envelope.data;
    expect(data).toBeDefined();
    expect(data!.name).toBe(payload.name);
    expect(data!.email).toBe(payload.email);
    expect(typeof data!._id).toBe('string');
  });

  it('lists suppliers using shared schema contract', async () => {
    await request(app).post('/api/suppliers').send(buildSupplierPayload()).expect(200);

    const response = await request(app).get('/api/suppliers').expect(200);

    const envelope = parseEnvelope(supplierListEnvelopeSchema, response.body);

    const data = envelope.data ?? [];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects invalid supplier payload via Zod validation', async () => {
    const response = await request(app)
      .post('/api/suppliers')
      .send({ name: '' }).expect(400);

    const envelope = parseEnvelope(errorEnvelopeSchema, response.body);

    expect(envelope.success).toBe(false);
    expect(envelope.message).toContain('Supplier name');
  });

  it('returns 404 envelope for non-existing supplier id', async () => {
    const response = await request(app)
      .get('/api/suppliers/507f1f77bcf86cd799439011')
      .expect(404);

    const envelope = parseEnvelope(errorEnvelopeSchema, response.body);

    expect(envelope.statusCode).toBe(404);
    expect(envelope.success).toBe(false);
  });

  it('rejects invalid supplier id formats with validation handler', async () => {
    const response = await request(app)
      .get('/api/suppliers/invalid-id')
      .expect(404);

    const envelope = parseEnvelope(errorEnvelopeSchema, response.body);

    expect(envelope.success).toBe(false);
    expect(
      Array.isArray(envelope.errors) ? envelope.errors[0]?.message : envelope.message,
    ).toBeDefined();
  });
});



