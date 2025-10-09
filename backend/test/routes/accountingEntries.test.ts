import express from 'express';
import request from 'supertest';
import router from '../../modules/accounting-old/accountingEntries';
import AccountingEntry from '../../models/AccountingEntry';

jest.mock('../../middleware/auth', () => ({
  __esModule: true,
  default: jest.fn((req, _res, next) => {
    const user = req.headers['x-test-user'];
    if (user) {
      (req as any).user = { id: Array.isArray(user) ? user[0] : user };
    }
    next();
  })
}));

jest.mock('../../models/AccountingEntry', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn()
  }
}));

const AccountingEntryMock = AccountingEntry as unknown as {
  find: jest.Mock;
  countDocuments: jest.Mock;
};

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/accounting-entries', router);
  return app;
};

describe('accountingEntries route guards', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  it('rejects unauthorized requests', async () => {
    await request(app)
      .get('/api/accounting-entries/by-account/507f1f77bcf86cd799439011')
      .expect(401);
  });

  it('validates account id format', async () => {
    await request(app)
      .get('/api/accounting-entries/by-account/invalid-id')
      .set('x-test-user', 'user-1')
      .expect(400);
  });

  it('returns formatted entries with filters applied', async () => {
    const mainEntries = [
      {
        _id: 'entry-1',
        sequence: 1,
        debitAmount: 100,
        creditAmount: 0,
        description: 'Test entry',
        accountId: { _id: 'acct-1', name: 'Cash', code: '101', accountType: 'asset' },
        categoryId: { _id: 'cat-1', name: 'Sales' },
        transactionGroupId: { _id: 'txn-1', groupNumber: 'TXN-1', transactionDate: new Date('2024-01-10'), description: 'Group', status: 'draft' },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'entry-2',
        sequence: 2,
        debitAmount: 0,
        creditAmount: 50,
        description: 'Second entry',
        accountId: { _id: 'acct-3', name: 'Bank', code: '102', accountType: 'asset' },
        categoryId: { _id: 'cat-2', name: 'Fees' },
        transactionGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const counterpartEntries = [
      {
        accountId: { _id: 'acct-2', name: 'Revenue', code: '401' }
      }
    ];

    const chain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mainEntries)
    };

    const counterpartChain = {
      populate: jest.fn().mockResolvedValue(counterpartEntries)
    };

    AccountingEntryMock.find
      .mockReturnValueOnce(chain)
      .mockReturnValueOnce(counterpartChain);

    AccountingEntryMock.countDocuments.mockResolvedValue(mainEntries.length);

    await request(app)
      .get('/api/accounting-entries/by-account/507f1f77bcf86cd799439011')
      .set('x-test-user', 'user-1')
      .query({ organizationId: '507f1f77bcf86cd799439012', startDate: '2024-01-01', endDate: '2024-12-31', page: '1', limit: '10' })
      .expect(200)
      .expect(res => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.entries[0].counterpartAccounts).toContain('Revenue');
      });

    expect(AccountingEntryMock.find).toHaveBeenCalledTimes(2);
  });

  it('handles internal errors gracefully', async () => {
    AccountingEntryMock.find.mockImplementation(() => { throw new Error('db failure'); });

    await request(app)
      .get('/api/accounting-entries/by-account/507f1f77bcf86cd799439011')
      .set('x-test-user', 'user-1')
      .expect(500);
  });
});
