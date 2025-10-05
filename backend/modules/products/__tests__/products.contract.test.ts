import request from 'supertest';
import type { Application } from 'express';
import BaseProduct from '../../../models/BaseProduct';
import { createApp } from '../../../app';

describe('productsContract router (feature flag enabled)', () => {
  let app: Application;

  beforeAll(() => {
    process.env.FEATURE_PRODUCTS_CONTRACT = 'true';
    process.env.NODE_ENV = 'test';
    app = createApp();
  });

  const basePayload = {
    code: 'PRD-CONTRACT-001',
    name: 'Contract Product',
    unit: 'box',
    purchasePrice: 10,
    sellingPrice: 15,
    description: 'Test product for contract router',
    packageUnits: [
      { unitName: 'Box', unitValue: 1, isBaseUnit: true, isActive: true },
      { unitName: 'Piece', unitValue: 10, isActive: true },
    ],
  } as const;

  const expectSuccessEnvelope = (body: any) => {
    expect(body).toMatchObject({
      success: true,
      message: expect.any(String),
    });
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
  };

  const expectErrorEnvelope = (body: any, statusCode: number) => {
    expect(body).toMatchObject({
      success: false,
      message: expect.any(String),
      statusCode,
    });
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
  };

  it('creates a product and returns legacy-style envelope', async () => {
    const response = await request(app)
      .post('/api/products/product')
      .send(basePayload)
      .expect(201);

    expectSuccessEnvelope(response.body);
    expect(response.body.data).toMatchObject({
      code: basePayload.code,
      name: basePayload.name,
      unit: basePayload.unit,
      productType: 'product',
    });
    expect(Array.isArray(response.body.data.packageUnits)).toBe(true);
  });

  it('rejects duplicate codes with 409 envelope', async () => {
    const payload = { ...basePayload, code: 'PRD-CONTRACT-409' };
    await request(app).post('/api/products/product').send(payload).expect(201);

    const duplicate = await request(app)
      .post('/api/products/product')
      .send(payload)
      .expect(409);

    expectErrorEnvelope(duplicate.body, 409);
  });

  it('lists products with envelope metadata', async () => {
    await BaseProduct.create({
      code: 'PRD-CONTRACT-LIST',
      name: 'List Product',
      unit: 'box',
      productType: 'product',
      isActive: true,
    });

    const response = await request(app)
      .get('/api/products')
      .expect(200);

    expectSuccessEnvelope(response.body);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('filters');
    expect(response.body).toHaveProperty('count');
  });

  it('updates and deletes a product returning envelopes', async () => {
    const created = await request(app)
      .post('/api/products/product')
      .send({ ...basePayload, code: 'PRD-CONTRACT-UPDATE' })
      .expect(201);

    const productId = created.body.data._id as string;

    const updateResponse = await request(app)
      .put(`/api/products/${productId}`)
      .send({ name: 'Updated Product', packageUnits: [] })
      .expect(200);

    expectSuccessEnvelope(updateResponse.body);
    expect(updateResponse.body.data).toMatchObject({ name: 'Updated Product' });

    const deleteResponse = await request(app)
      .delete(`/api/products/${productId}`)
      .expect(200);

    expectSuccessEnvelope(deleteResponse.body);
    expect(deleteResponse.body.data).toMatchObject({ isActive: false });
  });
});

