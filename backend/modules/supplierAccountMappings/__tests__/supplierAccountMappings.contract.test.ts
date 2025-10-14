import request from 'supertest';
import type { Application } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../../../app';
import Supplier from '../../../models/Supplier';
import Organization from '../../accounting-old/models/Organization';
import Account2 from '../../accounting-old/models/Account2';

describe('supplierAccountMappingsContract', () => {
  let app: Application;
  let supplierId: string;
  let organizationId: string;
  let accountIds: string[];

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    app = createApp();
  });

  beforeEach(async () => {
    const userId = new mongoose.Types.ObjectId();

    const organization = await Organization.create({
      code: 'ORG01',
      name: 'Test Organization',
      type: 'pharmacy',
      status: 'active',
      contact: {
        address: '123 Sample Street',
        phone: '0223456789',
      },
      business: {
        establishedDate: new Date('2020-01-01T00:00:00Z'),
      },
      settings: {
        timezone: 'Asia/Taipei',
        currency: 'TWD',
        language: 'en-US',
      },
      notes: 'Seed data for contract tests',
      createdBy: userId,
      updatedBy: userId,
    });

    const organizationObjectId = organization._id as mongoose.Types.ObjectId;
    organizationId = organizationObjectId.toHexString();

    const supplier = await Supplier.create({
      code: 'SUP001',
      shortCode: 'SP1',
      name: 'Test Supplier',
      contactPerson: 'Test Owner',
    });

    supplierId = (supplier._id as mongoose.Types.ObjectId).toHexString();

    const accounts = await Account2.insertMany([
      {
        code: '4001',
        name: 'Sales Revenue',
        accountType: 'revenue',
        type: 'other',
        level: 1,
        isActive: true,
        normalBalance: 'credit',
        balance: 0,
        initialBalance: 0,
        currency: 'TWD',
        organizationId: organizationObjectId,
        createdBy: 'system',
      },
      {
        code: '5001',
        name: 'Purchase Cost',
        accountType: 'expense',
        type: 'other',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        balance: 0,
        initialBalance: 0,
        currency: 'TWD',
        organizationId: organizationObjectId,
        createdBy: 'system',
      },
    ]);

    accountIds = accounts.map((account) => (account._id as mongoose.Types.ObjectId).toHexString());
  });

  it('manages supplier account mappings via ts-rest contract', async () => {
    const createResponse = await request(app)
      .post('/api/supplier-account-mappings')
      .send({
        supplierId,
        accountIds,
      })
      .expect(201);

    expect(createResponse.body?.success).toBe(true);
    expect(createResponse.body?.data).toBeDefined();
    expect(createResponse.body.data.accountMappings).toHaveLength(2);
    expect(createResponse.body.data.organizationId).toBe(organizationId);

    const mappingId = createResponse.body.data._id as string;

    const listResponse = await request(app)
      .get('/api/supplier-account-mappings')
      .query({ supplierId })
      .expect(200);

    expect(listResponse.body?.success).toBe(true);
    expect(Array.isArray(listResponse.body?.data)).toBe(true);
    expect(listResponse.body.data).toHaveLength(1);

    const getResponse = await request(app)
      .get(`/api/supplier-account-mappings/${mappingId}`)
      .expect(200);

    expect(getResponse.body?.success).toBe(true);
    expect(getResponse.body?.data?._id).toBe(mappingId);

    const bySupplierResponse = await request(app)
      .get(`/api/supplier-account-mappings/supplier/${supplierId}/accounts`)
      .expect(200);

    expect(bySupplierResponse.body?.success).toBe(true);
    expect(bySupplierResponse.body?.data?.supplierId).toBe(supplierId);

    const updateResponse = await request(app)
      .put(`/api/supplier-account-mappings/${mappingId}`)
      .send({
        accountIds: [accountIds[1]],
      })
      .expect(200);

    expect(updateResponse.body?.success).toBe(true);
    expect(updateResponse.body?.data?.accountMappings).toHaveLength(1);
    expect(updateResponse.body?.data?.accountMappings[0]?.accountCode).toBe('5001');

    await request(app)
      .delete(`/api/supplier-account-mappings/${mappingId}`)
      .expect(200);

    await request(app)
      .get(`/api/supplier-account-mappings/${mappingId}`)
      .expect(404);
  });
});







