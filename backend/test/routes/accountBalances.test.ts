import express from 'express';
import request from 'supertest';
import router from '../../modules/accounting-old/accountBalances';
import Account2 from '../../modules/accounting-old/models/Account2';
import AccountingEntry from '../../modules/accounting-old/models/AccountingEntry';

jest.mock('../../middleware/auth', () => ({
  __esModule: true,
  default: jest.fn((_req, _res, next) => next())
}));

jest.mock('../../modules/accounting-old/models/Account2', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn()
  }
}));

jest.mock('../../modules/accounting-old/models/AccountingEntry', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

const mockedAccount2 = Account2 as unknown as {
  find: jest.Mock;
  findById: jest.Mock;
};
const mockedAccountingEntry = AccountingEntry as unknown as {
  find: jest.Mock;
};

const accountFindMock = mockedAccount2.find;
const accountFindByIdMock = mockedAccount2.findById;
const accountingEntryFindMock = mockedAccountingEntry.find;

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/', router);
  return app;
};

const createObjectId = (id: string) => ({
  toString: () => id
});

describe('AccountBalances routes', () => {
  beforeEach(() => {
    accountFindMock.mockReset();
    accountFindByIdMock.mockReset();
    accountingEntryFindMock.mockReset();
  });

  it('summarizes balances with organization filter', async () => {
    const accounts = [
      {
        _id: createObjectId('acc-1'),
        code: '1001',
        name: 'Cash',
        accountType: 'asset',
        normalBalance: 'debit',
        initialBalance: 1000,
        isActive: true
      },
      {
        _id: createObjectId('acc-2'),
        code: '2001',
        name: 'Payable',
        accountType: 'liability',
        normalBalance: 'credit',
        initialBalance: 500,
        isActive: true
      }
    ];

    const sortMock = jest.fn().mockResolvedValue(accounts);
    accountFindMock.mockReturnValue({ sort: sortMock });

    accountingEntryFindMock
      .mockResolvedValueOnce([
        { debitAmount: 100, creditAmount: 20 },
        { debitAmount: 40, creditAmount: 10 }
      ])
      .mockResolvedValueOnce([
        { debitAmount: 25, creditAmount: 60 }
      ]);

    const response = await request(createTestApp())
      .get('/summary')
      .query({ organizationId: 'org-1' })
      .expect(200);

    expect(sortMock).toHaveBeenCalledWith({ code: 1 });
    expect(accountingEntryFindMock).toHaveBeenCalledTimes(2);
    expect(accountingEntryFindMock).toHaveBeenNthCalledWith(1, {
      accountId: accounts[0]._id,
      organizationId: 'org-1'
    });
    expect(accountingEntryFindMock).toHaveBeenNthCalledWith(2, {
      accountId: accounts[1]._id,
      organizationId: 'org-1'
    });
    expect(response.body.success).toBe(true);
    expect(response.body.totalAccounts).toBe(2);
    expect(response.body.summary.asset.count).toBe(1);
    expect(response.body.summary.asset.totalBalance).toBe(1110);
    expect(response.body.summary.liability.totalBalance).toBe(535);
  });

  it('handles errors when summarizing balances', async () => {
    const sortMock = jest.fn().mockRejectedValue(new Error('db failure'));
    accountFindMock.mockReturnValue({ sort: sortMock });

    const response = await request(createTestApp())
      .get('/summary')
      .expect(500);

    expect(response.body.message).toBeDefined();
    expect(accountingEntryFindMock).not.toHaveBeenCalled();
  });

  it('returns account balances by id', async () => {
    const account = {
      _id: createObjectId('acc-3'),
      code: '3001',
      name: 'Inventory',
      accountType: 'asset',
      normalBalance: 'debit',
      initialBalance: 200
    };

    accountFindByIdMock.mockResolvedValue(account);
    accountingEntryFindMock.mockResolvedValue([
      { debitAmount: 80, creditAmount: 20 },
      { debitAmount: 10, creditAmount: 5 }
    ]);

    const response = await request(createTestApp())
      .get(`/${account._id.toString()}`)
      .query({ organizationId: 'org-2' })
      .expect(200);

    expect(accountFindByIdMock).toHaveBeenCalledWith(account._id.toString());
    expect(accountingEntryFindMock).toHaveBeenCalledWith({
      accountId: account._id.toString(),
      organizationId: 'org-2'
    });
    expect(response.body.accountId).toBe(account._id.toString());
    expect(response.body.debitTotal).toBe(90);
    expect(response.body.creditTotal).toBe(25);
    expect(response.body.actualBalance).toBe(265);
  });

  it('returns 404 when account not found', async () => {
    accountFindByIdMock.mockResolvedValue(null);

    const response = await request(createTestApp())
      .get('/missing-account')
      .expect(404);

    expect(response.body.message).toBeDefined();
    expect(accountingEntryFindMock).not.toHaveBeenCalled();
  });

  it('validates batch payload shape', async () => {
    const response = await request(createTestApp())
      .post('/batch')
      .send({})
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('calculates batch balances for multiple accounts', async () => {
    const account1 = {
      _id: createObjectId('acc-10'),
      code: '1010',
      name: 'Checking',
      accountType: 'asset',
      normalBalance: 'debit',
      initialBalance: 300
    };
    const account2 = {
      _id: createObjectId('acc-20'),
      code: '2020',
      name: 'Liability',
      accountType: 'liability',
      normalBalance: 'credit',
      initialBalance: 150
    };

    accountFindByIdMock
      .mockResolvedValueOnce(account1)
      .mockResolvedValueOnce(account2)
      .mockResolvedValueOnce(null);

    accountingEntryFindMock
      .mockResolvedValueOnce([
        { debitAmount: 10, creditAmount: 5 }
      ])
      .mockResolvedValueOnce([
        { debitAmount: 0, creditAmount: 20 }
      ])
      .mockResolvedValue([]);

    const response = await request(createTestApp())
      .post('/batch')
      .send({ accountIds: ['acc-10', 'acc-20', 'missing'], organizationId: 'org-3' })
      .expect(200);

    expect(accountFindByIdMock).toHaveBeenNthCalledWith(1, 'acc-10');
    expect(accountFindByIdMock).toHaveBeenNthCalledWith(2, 'acc-20');
    expect(accountFindByIdMock).toHaveBeenNthCalledWith(3, 'missing');
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(2);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].actualBalance).toBe(305);
    expect(response.body.data[1].actualBalance).toBe(170);
  });
});
