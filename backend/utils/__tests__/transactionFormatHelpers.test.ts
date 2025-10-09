import mongoose from 'mongoose';

jest.mock('../logger', () => ({
  businessLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
}));

const loggerModule = require('../logger') as {
  businessLogger: {
    debug: jest.Mock;
    info: jest.Mock;
    error: jest.Mock;
  }
};
const { businessLogger } = loggerModule;

import {
  buildEmbeddedEntries,
  validateEntriesIntegrity,
  calculateBalance,
  buildTransactionGroupData
} from '../../modules/accounting-old/utils/transactionFormatHelpers';

describe('transactionFormatHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildEmbeddedEntries', () => {
    it('transforms entries and includes optional fields when valid identifiers are provided', () => {
      const organizationId = new mongoose.Types.ObjectId().toHexString();
      const categoryId = new mongoose.Types.ObjectId().toHexString();
      const sourceTransactionId = new mongoose.Types.ObjectId().toHexString();

      const entries = [
        {
          accountId: new mongoose.Types.ObjectId().toHexString(),
          debitAmount: '100.5',
          creditAmount: 0
        },
        {
          accountId: new mongoose.Types.ObjectId().toHexString(),
          debitAmount: 0,
          creditAmount: '50',
          categoryId,
          sourceTransactionId,
          description: 'provided description',
          fundingPath: ['root', 'child']
        }
      ];

      const result = buildEmbeddedEntries(entries, 'fallback description', organizationId);

      expect(result).toHaveLength(2);

      const firstEntry = result[0];
      expect(firstEntry.accountId).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(firstEntry.description).toBe('fallback description');
      expect(firstEntry).not.toHaveProperty('categoryId');
      expect(firstEntry).not.toHaveProperty('sourceTransactionId');
      expect(firstEntry).not.toHaveProperty('fundingPath');

      const secondEntry = result[1];
      expect(secondEntry.categoryId?.toString()).toBe(categoryId);
      expect(secondEntry.organizationId?.toString()).toBe(organizationId);
      expect(secondEntry.sourceTransactionId?.toString()).toBe(sourceTransactionId);
      expect(secondEntry.fundingPath).toEqual(['root', 'child']);
      expect(secondEntry.description).toBe('provided description');
      expect(secondEntry.debitAmount).toBe(0);
      expect(secondEntry.creditAmount).toBe(50);
    });

    it('omits optional identifiers when organizationId is not a valid ObjectId', () => {
      const invalidOrganizationId = 'not-a-valid-object-id';
      const entries = [
        {
          accountId: new mongoose.Types.ObjectId().toHexString(),
          debitAmount: 10,
          creditAmount: 0
        }
      ];

      const [entry] = buildEmbeddedEntries(entries, 'desc', invalidOrganizationId);

      expect(entry.organizationId).toBeUndefined();
    });

    it('throws when accountId is missing or invalid', () => {
      const entries = [
        {
          accountId: 'invalid',
          debitAmount: 0,
          creditAmount: 5
        }
      ];

      expect(() => buildEmbeddedEntries(entries, 'desc')).toThrow(/科目ID/);
    });
  });

  describe('validateEntriesIntegrity', () => {
    it('validates debit/credit combinations and account identifiers', () => {
      const validEntry = {
        accountId: new mongoose.Types.ObjectId().toHexString(),
        debitAmount: 100,
        creditAmount: 0
      };

      const invalidAccountEntry = {
        accountId: '',
        debitAmount: 0,
        creditAmount: 50
      };

      const doubleBookedEntry = {
        accountId: new mongoose.Types.ObjectId().toHexString(),
        debitAmount: 10,
        creditAmount: 5
      };

      expect(validateEntriesIntegrity([validEntry])).toBe(true);
      expect(validateEntriesIntegrity([invalidAccountEntry])).toBe(false);
      expect(validateEntriesIntegrity([doubleBookedEntry])).toBe(false);
    });
  });

  describe('calculateBalance', () => {
    it('detects balanced and unbalanced totals', () => {
      const balanced = calculateBalance([
        { debitAmount: 50, creditAmount: 0 },
        { debitAmount: 0, creditAmount: 50 }
      ]);
      expect(balanced.isBalanced).toBe(true);

      const unbalanced = calculateBalance([
        { debitAmount: 30, creditAmount: 0 },
        { debitAmount: 0, creditAmount: 10 }
      ]);
      expect(unbalanced.isBalanced).toBe(false);
    });
  });

  describe('buildTransactionGroupData', () => {
    it('hydrates identifiers and preserves provided metadata', () => {
      const organizationId = new mongoose.Types.ObjectId().toHexString();
      const linkedId = new mongoose.Types.ObjectId().toHexString();
      const sourceId = new mongoose.Types.ObjectId().toHexString();

      const result = buildTransactionGroupData(
        {
          description: 'Monthly posting',
          transactionDate: '2024-04-01T00:00:00.000Z',
          organizationId,
          receiptUrl: 'http://files/receipt.pdf',
          invoiceNo: 'INV-001',
          linkedTransactionIds: [linkedId],
          sourceTransactionId: sourceId,
          fundingType: 'adjustment',
          status: 'confirmed'
        },
        'user-123',
        'TXN-0001',
        [{ sequence: 1 }],
        1500
      );

      expect(result.groupNumber).toBe('TXN-0001');
      expect(result.organizationId?.toString()).toBe(organizationId);
      expect(result.linkedTransactionIds[0].toString()).toBe(linkedId);
      expect(result.sourceTransactionId?.toString()).toBe(sourceId);
      expect(result.fundingType).toBe('adjustment');
      expect(result.status).toBe('confirmed');
    });

    it('logs when organizationId is missing or invalid', () => {
      buildTransactionGroupData(
        {
          description: 'Personal bookkeeping',
          transactionDate: '2024-04-01T00:00:00.000Z',
          organizationId: 'invalid',
          linkedTransactionIds: [],
          sourceTransactionId: undefined
        },
        'user-456',
        'TXN-0002',
        [],
        0
      );

      expect(businessLogger.debug).toHaveBeenCalledWith(expect.stringContaining('記帳'));
    });
  });
});
