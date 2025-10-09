// 在導入任何模組之前設置環境變數
process.env.NODE_ENV = 'test';

import request from 'supertest';
import express from 'express';
import {
  validateDoubleEntryBalance,
  validateSingleEntry,
  validateTransactionGroup,
  validateCompleteTransaction
} from '../doubleEntryValidation';

// Mock DoubleEntryValidator
jest.mock('../../utils/doubleEntryValidation');
import DoubleEntryValidator from '../../modules/accounting-old/utils/doubleEntryValidation';
const mockValidator = DoubleEntryValidator as jest.Mocked<typeof DoubleEntryValidator>;

// Mock console methods to reduce test output noise
const originalConsoleError = console.error;

beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// 創建測試應用
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // 測試路由 - 借貸平衡驗證
  app.post('/test/double-entry', validateDoubleEntryBalance, (_req, res) => {
    res.json({ success: true, message: '借貸平衡驗證通過' });
  });
  
  // 測試路由 - 單筆分錄驗證
  app.post('/test/single-entry', validateSingleEntry, (_req, res) => {
    res.json({ success: true, message: '單筆分錄驗證通過' });
  });
  
  // 測試路由 - 交易群組驗證
  app.post('/test/transaction-group', validateTransactionGroup, (_req, res) => {
    res.json({ success: true, message: '交易群組驗證通過' });
  });
  
  // 測試路由 - 完整交易驗證
  app.post('/test/complete-transaction', validateCompleteTransaction, (_req: any, res: any) => {
    res.json({ success: true, message: '完整交易驗證通過' });
  });
  
  return app;
};

describe('DoubleEntryValidation Middleware 測試', () => {
  let testApp: express.Application;

  beforeEach(() => {
    testApp = createTestApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateDoubleEntryBalance 測試', () => {
    test('應該拒絕缺少分錄資料的請求', async () => {
      const response = await request(testApp)
        .post('/test/double-entry')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '缺少記帳分錄資料或格式錯誤',
        error: 'MISSING_ENTRIES'
      });
    });

    test('應該拒絕分錄不是陣列的請求', async () => {
      const response = await request(testApp)
        .post('/test/double-entry')
        .send({ entries: 'not-an-array' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '缺少記帳分錄資料或格式錯誤',
        error: 'MISSING_ENTRIES'
      });
    });

    test('應該拒絕分錄數量少於2筆的請求', async () => {
      const response = await request(testApp)
        .post('/test/double-entry')
        .send({ entries: [{ accountId: '1', debitAmount: 100 }] })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '複式記帳至少需要兩筆分錄',
        error: 'INSUFFICIENT_ENTRIES'
      });
    });

    test('應該拒絕借貸不平衡的分錄', async () => {
      const entries = [
        { accountId: '1', debitAmount: 100, creditAmount: 0 },
        { accountId: '2', debitAmount: 0, creditAmount: 50 }
      ];

      mockValidator.validateTransactionGroup.mockReturnValue({
        isValid: false,
        balanceInfo: {
          totalDebit: 100,
          totalCredit: 50,
          difference: 50,
          isBalanced: false,
          message: '借貸不平衡'
        },
        errors: ['借貸不平衡']
      });

      const response = await request(testApp)
        .post('/test/double-entry')
        .send({ entries })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '借貸不平衡',
        error: 'UNBALANCED_ENTRIES',
        details: {
          totalDebit: 100,
          totalCredit: 50,
          difference: 50,
          errors: ['借貸不平衡']
        }
      });

      expect(mockValidator.validateTransactionGroup).toHaveBeenCalledWith(entries);
    });

    test('應該接受借貸平衡的分錄', async () => {
      const entries = [
        { accountId: '1', debitAmount: 100, creditAmount: 0 },
        { accountId: '2', debitAmount: 0, creditAmount: 100 }
      ];

      mockValidator.validateTransactionGroup.mockReturnValue({
        isValid: true,
        balanceInfo: {
          totalDebit: 100,
          totalCredit: 100,
          difference: 0,
          isBalanced: true,
          message: '借貸平衡'
        },
        errors: []
      });

      const response = await request(testApp)
        .post('/test/double-entry')
        .send({ entries })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '借貸平衡驗證通過'
      });
    });

    test('應該處理驗證器拋出的異常', async () => {
      const entries = [
        { accountId: '1', debitAmount: 100, creditAmount: 0 },
        { accountId: '2', debitAmount: 0, creditAmount: 100 }
      ];

      mockValidator.validateTransactionGroup.mockImplementation(() => {
        throw new Error('驗證器錯誤');
      });

      const response = await request(testApp)
        .post('/test/double-entry')
        .send({ entries })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: '借貸平衡驗證失敗',
        error: 'VALIDATION_ERROR'
      });
    });
  });

  describe('validateSingleEntry 測試', () => {
    test('應該拒絕缺少必要欄位的分錄', async () => {
      const response = await request(testApp)
        .post('/test/single-entry')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '缺少必要欄位: accountId, description',
        error: 'MISSING_REQUIRED_FIELDS',
        details: { missingFields: ['accountId', 'description'] }
      });
    });

    test('應該拒絕部分缺少必要欄位的分錄', async () => {
      const response = await request(testApp)
        .post('/test/single-entry')
        .send({ accountId: '1' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '缺少必要欄位: description',
        error: 'MISSING_REQUIRED_FIELDS',
        details: { missingFields: ['description'] }
      });
    });

    test('應該拒絕無效的金額格式', async () => {
      const response = await request(testApp)
        .post('/test/single-entry')
        .send({
          accountId: '1',
          description: '測試分錄',
          debitAmount: 'invalid',
          creditAmount: 0
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '借方金額和貸方金額必須為有效數字',
        error: 'INVALID_AMOUNT_FORMAT'
      });
    });

    test('應該拒絕負數金額', async () => {
      const response = await request(testApp)
        .post('/test/single-entry')
        .send({
          accountId: '1',
          description: '測試分錄',
          debitAmount: -100,
          creditAmount: 0
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '借方金額和貸方金額不能為負數',
        error: 'NEGATIVE_AMOUNT'
      });
    });

    test('應該拒絕借貸金額都為0的分錄', async () => {
      const response = await request(testApp)
        .post('/test/single-entry')
        .send({
          accountId: '1',
          description: '測試分錄',
          debitAmount: 0,
          creditAmount: 0
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '借方金額或貸方金額至少要有一個大於0',
        error: 'ZERO_AMOUNTS'
      });
    });

    test('應該拒絕借貸金額都大於0的分錄', async () => {
      const response = await request(testApp)
        .post('/test/single-entry')
        .send({
          accountId: '1',
          description: '測試分錄',
          debitAmount: 100,
          creditAmount: 50
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '借方金額和貸方金額不能同時大於0',
        error: 'BOTH_AMOUNTS_POSITIVE'
      });
    });

    test('應該接受有效的借方分錄', async () => {
      const response = await request(testApp)
        .post('/test/single-entry')
        .send({
          accountId: '1',
          description: '測試分錄',
          debitAmount: 100,
          creditAmount: 0
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '單筆分錄驗證通過'
      });
    });

    test('應該接受有效的貸方分錄', async () => {
      const response = await request(testApp)
        .post('/test/single-entry')
        .send({
          accountId: '1',
          description: '測試分錄',
          debitAmount: 0,
          creditAmount: 100
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '單筆分錄驗證通過'
      });
    });

    test('應該處理字串格式的有效金額', async () => {
      const response = await request(testApp)
        .post('/test/single-entry')
        .send({
          accountId: '1',
          description: '測試分錄',
          debitAmount: '100.50',
          creditAmount: '0'
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '單筆分錄驗證通過'
      });
    });
  });

  describe('validateTransactionGroup 測試', () => {
    test('應該拒絕缺少描述的交易群組', async () => {
      const response = await request(testApp)
        .post('/test/transaction-group')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '交易描述不能為空',
        error: 'MISSING_DESCRIPTION'
      });
    });

    test('應該拒絕空白描述的交易群組', async () => {
      const response = await request(testApp)
        .post('/test/transaction-group')
        .send({ description: '   ' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '交易描述不能為空',
        error: 'MISSING_DESCRIPTION'
      });
    });

    test('應該拒絕無效日期格式的交易群組', async () => {
      const response = await request(testApp)
        .post('/test/transaction-group')
        .send({
          description: '測試交易',
          date: 'invalid-date'
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '日期格式錯誤',
        error: 'INVALID_DATE_FORMAT'
      });
    });

    test('應該拒絕過長的參考號碼', async () => {
      const longReference = 'a'.repeat(51);
      
      const response = await request(testApp)
        .post('/test/transaction-group')
        .send({
          description: '測試交易',
          reference: longReference
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '參考號碼長度不能超過 50 字元',
        error: 'REFERENCE_TOO_LONG'
      });
    });

    test('應該接受有效的交易群組', async () => {
      const response = await request(testApp)
        .post('/test/transaction-group')
        .send({
          description: '測試交易',
          date: '2024-01-01',
          reference: 'REF001'
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '交易群組驗證通過'
      });
    });

    test('應該接受只有描述的最小交易群組', async () => {
      const response = await request(testApp)
        .post('/test/transaction-group')
        .send({
          description: '測試交易'
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '交易群組驗證通過'
      });
    });

    test('應該接受有效的 ISO 日期格式', async () => {
      const response = await request(testApp)
        .post('/test/transaction-group')
        .send({
          description: '測試交易',
          date: '2024-01-01T10:00:00.000Z'
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '交易群組驗證通過'
      });
    });

    test('應該接受50字元的參考號碼', async () => {
      const maxReference = 'a'.repeat(50);
      
      const response = await request(testApp)
        .post('/test/transaction-group')
        .send({
          description: '測試交易',
          reference: maxReference
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '交易群組驗證通過'
      });
    });
  });

  describe('validateCompleteTransaction 測試', () => {
    test('應該依序執行交易群組和借貸平衡驗證', async () => {
      // 先測試交易群組驗證失敗的情況
      const response1 = await request(testApp)
        .post('/test/complete-transaction')
        .send({
          // 缺少描述，應該在交易群組驗證階段失敗
          entries: [
            { accountId: '1', debitAmount: 100, creditAmount: 0 },
            { accountId: '2', debitAmount: 0, creditAmount: 100 }
          ]
        })
        .expect(400);

      expect(response1.body).toEqual({
        success: false,
        message: '交易描述不能為空',
        error: 'MISSING_DESCRIPTION'
      });

      // 測試通過交易群組驗證但借貸平衡驗證失敗的情況
      mockValidator.validateTransactionGroup.mockReturnValue({
        isValid: false,
        balanceInfo: {
          totalDebit: 100,
          totalCredit: 50,
          difference: 50,
          isBalanced: false,
          message: '借貸不平衡'
        },
        errors: ['借貸不平衡']
      });

      const response2 = await request(testApp)
        .post('/test/complete-transaction')
        .send({
          description: '測試交易',
          entries: [
            { accountId: '1', debitAmount: 100, creditAmount: 0 },
            { accountId: '2', debitAmount: 0, creditAmount: 50 }
          ]
        })
        .expect(400);

      expect(response2.body).toEqual({
        success: false,
        message: '借貸不平衡',
        error: 'UNBALANCED_ENTRIES',
        details: {
          totalDebit: 100,
          totalCredit: 50,
          difference: 50,
          errors: ['借貸不平衡']
        }
      });

      // 測試兩個驗證都通過的情況
      mockValidator.validateTransactionGroup.mockReturnValue({
        isValid: true,
        balanceInfo: {
          totalDebit: 100,
          totalCredit: 100,
          difference: 0,
          isBalanced: true,
          message: '借貸平衡'
        },
        errors: []
      });

      const response3 = await request(testApp)
        .post('/test/complete-transaction')
        .send({
          description: '測試交易',
          date: '2024-01-01',
          reference: 'REF001',
          entries: [
            { accountId: '1', debitAmount: 100, creditAmount: 0 },
            { accountId: '2', debitAmount: 0, creditAmount: 100 }
          ]
        })
        .expect(200);

      expect(response3.body).toEqual({
        success: true,
        message: '完整交易驗證通過'
      });
    });
  });

  describe('錯誤處理測試', () => {
    test('validateSingleEntry 應該處理異常', async () => {
      // 創建一個會拋出異常的測試應用
      const errorApp = express();
      errorApp.use(express.json());
      
      // 模擬中間件內部拋出異常
      errorApp.post('/test', (req, res, next) => {
        // 破壞 req.body 來觸發異常
        Object.defineProperty(req, 'body', {
          get() {
            throw new Error('Request body error');
          }
        });
        validateSingleEntry(req, res, next);
      });

      const response = await request(errorApp)
        .post('/test')
        .send({ accountId: '1', description: '測試' })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: '分錄驗證失敗',
        error: 'VALIDATION_ERROR'
      });
    });

    test('validateTransactionGroup 應該處理異常', async () => {
      const errorApp = express();
      errorApp.use(express.json());
      
      errorApp.post('/test', (req, res, next) => {
        Object.defineProperty(req, 'body', {
          get() {
            throw new Error('Request body error');
          }
        });
        validateTransactionGroup(req, res, next);
      });

      const response = await request(errorApp)
        .post('/test')
        .send({ description: '測試交易' })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: '交易群組驗證失敗',
        error: 'VALIDATION_ERROR'
      });
    });
  });

  describe('邊界條件測試', () => {
    test('應該處理空陣列的分錄', async () => {
      const response = await request(testApp)
        .post('/test/double-entry')
        .send({ entries: [] })
        .expect(400);

      expect(response.body.error).toBe('INSUFFICIENT_ENTRIES');
    });

    test('應該處理未定義的金額欄位', async () => {
      const response = await request(testApp)
        .post('/test/single-entry')
        .send({
          accountId: '1',
          description: '測試分錄'
          // debitAmount 和 creditAmount 未定義
        })
        .expect(400);

      expect(response.body.error).toBe('ZERO_AMOUNTS');
    });

    test('應該處理null值的金額欄位', async () => {
      const response = await request(testApp)
        .post('/test/single-entry')
        .send({
          accountId: '1',
          description: '測試分錄',
          debitAmount: null,
          creditAmount: 100
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('應該處理極小的正數金額', async () => {
      const response = await request(testApp)
        .post('/test/single-entry')
        .send({
          accountId: '1',
          description: '測試分錄',
          debitAmount: 0.01,
          creditAmount: 0
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});