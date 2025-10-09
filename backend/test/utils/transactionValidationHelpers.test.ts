import mongoose from 'mongoose';
import * as helpers from '../../modules/accounting-old/utils/transactionValidationHelpers';
import TransactionGroupWithEntries from '../../modules/accounting-old/models/TransactionGroupWithEntries';

jest.mock('../../models/TransactionGroupWithEntries', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    find: jest.fn()
  }
}));

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}));

const mockedModel = TransactionGroupWithEntries as unknown as {
  findOne: jest.Mock;
  find: jest.Mock;
};

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('transactionValidationHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendErrorResponse / sendSuccessResponse', () => {
    it('formats error responses with optional data', () => {
      const res = createMockRes();
      helpers.sendErrorResponse(res as any, 400, 'Bad request', { reason: 'invalid' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad request',
        data: { reason: 'invalid' }
      });
    });

    it('formats success responses with optional message', () => {
      const res = createMockRes();
      helpers.sendSuccessResponse(res as any, { ok: true }, 'Done', 201);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { ok: true },
        message: 'Done'
      });
    });
  });

  describe('validateUserAuth', () => {
    it('returns user id when present', () => {
      const res = createMockRes();
      const userId = helpers.validateUserAuth({ user: { id: 'user-1' } } as any, res as any);
      expect(userId).toBe('user-1');
      expect(res.status).not.toHaveBeenCalled();
    });

    it('sends 401 when user missing', () => {
      const res = createMockRes();
      const userId = helpers.validateUserAuth({} as any, res as any);
      expect(userId).toBeNull();
      expect(res.status).toHaveBeenCalledWith(401);
      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(false);
      expect(typeof payload.message).toBe('string');
    });
  });

  describe('findAndValidateTransactionGroup', () => {
    it('returns transaction group when found', async () => {
      const doc = { _id: 'tx-1' };
      mockedModel.findOne.mockResolvedValueOnce(doc);
      const res = createMockRes();
      const result = await helpers.findAndValidateTransactionGroup('tx-1', 'user-1', res as any);
      expect(result).toBe(doc);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns null and sends 404 when not found', async () => {
      mockedModel.findOne.mockResolvedValueOnce(null);
      const res = createMockRes();
      const spy = jest.spyOn(helpers, 'sendErrorResponse');
      const result = await helpers.findAndValidateTransactionGroup('tx-1', 'user-1', res as any);
      expect(result).toBeNull();
      const notFoundArgs = spy.mock.calls[0];
      expect(notFoundArgs[0]).toBe(res);
      expect(notFoundArgs[1]).toBe(404);
      expect(typeof notFoundArgs[2]).toBe('string');

      spy.mockRestore();
    });

    it('handles query errors', async () => {
      const error = new Error('db down');
      mockedModel.findOne.mockRejectedValueOnce(error);
      const res = createMockRes();
      const spy = jest.spyOn(helpers, 'sendErrorResponse');
      const result = await helpers.findAndValidateTransactionGroup('tx-1', 'user-1', res as any);
      expect(result).toBeNull();
      const errorArgs = spy.mock.calls[0];
      expect(errorArgs[0]).toBe(res);
      expect(errorArgs[1]).toBe(500);
      expect(typeof errorArgs[2]).toBe('string');

      spy.mockRestore();
    });
  });

  describe('validateTransactionStatus', () => {
    it('allows allowed statuses', () => {
      const res = createMockRes();
      const ok = helpers.validateTransactionStatus({ status: 'draft' }, res as any, ['draft']);
      expect(ok).toBe(true);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('blocks confirmed transactions', () => {
      const res = createMockRes();
      const ok = helpers.validateTransactionStatus({ status: 'confirmed' }, res as any, ['draft']);
      expect(ok).toBe(false);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('blocks cancelled transactions', () => {
      const res = createMockRes();
      const ok = helpers.validateTransactionStatus({ status: 'cancelled' }, res as any, ['draft']);
      expect(ok).toBe(false);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateTransactionForConfirmation', () => {
    it('rejects confirmed status', () => {
      const res = createMockRes();
      const ok = helpers.validateTransactionForConfirmation({ status: 'confirmed' }, res as any);
      expect(ok).toBe(false);
    });

    it('rejects cancelled status', () => {
      const res = createMockRes();
      const ok = helpers.validateTransactionForConfirmation({ status: 'cancelled' }, res as any);
      expect(ok).toBe(false);
    });

    it('rejects missing entries', () => {
      const res = createMockRes();
      const ok = helpers.validateTransactionForConfirmation({ status: 'draft', entries: [] }, res as any);
      expect(ok).toBe(false);
    });

    it('allows draft with entries', () => {
      const res = createMockRes();
      const ok = helpers.validateTransactionForConfirmation({ status: 'draft', entries: [{}, {}] }, res as any);
      expect(ok).toBe(true);
    });
  });

  describe('validateTransactionForUnlock', () => {
    it('requires confirmed status', async () => {
      const res = createMockRes();
      const ok = await helpers.validateTransactionForUnlock({ status: 'draft' }, 'user-1', res as any);
      expect(ok).toBe(false);
    });

    it('rejects when dependent transactions exist', async () => {
      mockedModel.find.mockResolvedValueOnce([
        { _id: 'dep-1', groupNumber: 'G1', description: 'desc', totalAmount: 100, status: 'draft' }
      ]);
      const res = createMockRes();
      const ok = await helpers.validateTransactionForUnlock({ status: 'confirmed', _id: 'tx-1' }, 'user-1', res as any);
      expect(ok).toBe(false);
      expect(res.json.mock.calls[0][0].data.dependentTransactions).toHaveLength(1);
    });

    it('passes when no dependents', async () => {
      mockedModel.find.mockResolvedValueOnce([]);
      const res = createMockRes();
      const ok = await helpers.validateTransactionForUnlock({ status: 'confirmed', _id: 'tx-1' }, 'user-1', res as any);
      expect(ok).toBe(true);
    });
  });

  describe('buildQueryFilter', () => {
    it('builds filter with optional parameters', () => {
      const filter = helpers.buildQueryFilter('user', {
        organizationId: new mongoose.Types.ObjectId().toHexString(),
        status: 'draft',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        search: 'invoice-123'
      });
      expect(filter.organizationId).toBeDefined();
      expect(filter.status).toBe('draft');
      expect(filter.transactionDate.$gte).toEqual(new Date('2024-01-01'));
      expect(filter.$or).toBeDefined();
    });

    it('skips invalid optional parameters', () => {
      const filter = helpers.buildQueryFilter('user', {
        organizationId: '',
        status: 'unknown',
        search: '  '
      });
      expect(filter.organizationId).toBeUndefined();
      expect(filter.status).toBeUndefined();
      expect(filter.$or).toBeUndefined();
    });
  });

  describe('buildPaginationParams', () => {
    it('parses page and limit numbers', () => {
      const { pageNum, limitNum, skip } = helpers.buildPaginationParams({ page: '3', limit: '10' });
      expect(pageNum).toBe(3);
      expect(limitNum).toBe(10);
      expect(skip).toBe(20);
    });
  });

  describe('validateBasicTransactionData', () => {
    it('requires non-empty description', () => {
      const res = createMockRes();
      const ok = helpers.validateBasicTransactionData({ description: '  ' }, res as any);
      expect(ok).toBe(false);
    });

    it('requires valid transaction date', () => {
      const res = createMockRes();
      const ok = helpers.validateBasicTransactionData({ description: 'Test', transactionDate: 'bad', entries: [{}, {}] }, res as any);
      expect(ok).toBe(false);
    });

    it('requires at least two entries', () => {
      const res = createMockRes();
      const ok = helpers.validateBasicTransactionData({ description: 'Test', transactionDate: '2024-01-01', entries: [{}] }, res as any);
      expect(ok).toBe(false);
    });

    it('accepts valid data', () => {
      const res = createMockRes();
      const ok = helpers.validateBasicTransactionData({
        description: 'Valid',
        transactionDate: '2024-01-01',
        entries: [{}, {}]
      }, res as any);
      expect(ok).toBe(true);
    });
  });

  describe('handleRouteError', () => {
    it('serializes errors and returns 500', () => {
      const res = createMockRes();
      const error = new Error('boom');
      helpers.handleRouteError(error, res as any, 'Load');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });
});
