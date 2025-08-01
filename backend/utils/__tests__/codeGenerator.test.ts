import {
  generateNextProductCode,
  generateNextMedicineCode,
  generateProductCodeByHealthInsurance
} from '../codeGenerator';
import { Product, Medicine } from '../../models/BaseProduct';

// Mock the models
jest.mock('../../models/BaseProduct');

const MockedProduct = Product as jest.Mocked<typeof Product>;
const MockedMedicine = Medicine as jest.Mocked<typeof Medicine>;

describe('codeGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // Mock console.error
  });

  describe('generateNextProductCode', () => {
    it('應該生成第一個產品編號', async () => {
      // Mock no existing products
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };
      MockedProduct.find.mockReturnValue(mockFind as any);

      const result = await generateNextProductCode();

      expect(result.success).toBe(true);
      expect(result.code).toBe('P10001');
      expect(result.metadata?.length).toBe(6);
      expect(result.metadata?.charset).toBe('P + digits');
      expect(result.metadata?.generatedAt).toBeInstanceOf(Date);
    });

    it('應該生成下一個產品編號', async () => {
      // Mock existing products
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'P10001' },
          { code: 'P10002' },
          { code: 'P10005' }
        ])
      };
      MockedProduct.find.mockReturnValue(mockFind as any);

      const result = await generateNextProductCode();

      expect(result.success).toBe(true);
      expect(result.code).toBe('P10006');
    });

    it('應該處理不規則的產品編號', async () => {
      // Mock products with irregular codes
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'P10001' },
          { code: 'PABC123' }, // Invalid format
          { code: 'P10003' },
          { code: 'P' } // Invalid format
        ])
      };
      MockedProduct.find.mockReturnValue(mockFind as any);

      const result = await generateNextProductCode();

      expect(result.success).toBe(true);
      expect(result.code).toBe('P10004'); // Should skip invalid formats
    });

    it('應該處理空的數字部分', async () => {
      // Mock products with invalid numeric parts
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'PABC' },
          { code: 'PXYZ' }
        ])
      };
      MockedProduct.find.mockReturnValue(mockFind as any);

      const result = await generateNextProductCode();

      expect(result.success).toBe(true);
      expect(result.code).toBe('P10001'); // Should default to P10001
    });

    it('應該處理數據庫錯誤', async () => {
      // Mock database error
      MockedProduct.find.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await generateNextProductCode();

      expect(result.success).toBe(false);
      expect(result.code).toMatch(/^P\d+$/); // Should be fallback code with timestamp
      expect(result.error).toBe('Database connection failed');
      expect(result.metadata?.charset).toBe('P + timestamp');
    });

    it('應該處理極大的產品編號', async () => {
      // Mock products with large numbers
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'P999999' }
        ])
      };
      MockedProduct.find.mockReturnValue(mockFind as any);

      const result = await generateNextProductCode();

      expect(result.success).toBe(true);
      expect(result.code).toBe('P1000000');
    });
  });

  describe('generateNextMedicineCode', () => {
    it('應該生成第一個藥品編號', async () => {
      // Mock no existing medicines
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };
      MockedMedicine.find.mockReturnValue(mockFind as any);

      const result = await generateNextMedicineCode();

      expect(result.success).toBe(true);
      expect(result.code).toBe('M10001');
      expect(result.metadata?.length).toBe(6);
      expect(result.metadata?.charset).toBe('M + digits');
    });

    it('應該生成下一個藥品編號', async () => {
      // Mock existing medicines
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'M10001' },
          { code: 'M10003' },
          { code: 'M10007' }
        ])
      };
      MockedMedicine.find.mockReturnValue(mockFind as any);

      const result = await generateNextMedicineCode();

      expect(result.success).toBe(true);
      expect(result.code).toBe('M10008');
    });

    it('應該處理不規則的藥品編號', async () => {
      // Mock medicines with irregular codes
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'M10001' },
          { code: 'MABC123' }, // Invalid format
          { code: 'M10002' }
        ])
      };
      MockedMedicine.find.mockReturnValue(mockFind as any);

      const result = await generateNextMedicineCode();

      expect(result.success).toBe(true);
      expect(result.code).toBe('M10003');
    });

    it('應該處理數據庫錯誤', async () => {
      // Mock database error
      MockedMedicine.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await generateNextMedicineCode();

      expect(result.success).toBe(false);
      expect(result.code).toMatch(/^M\d+$/);
      expect(result.error).toBe('Database error');
    });

    it('應該處理空的數字部分', async () => {
      // Mock medicines with invalid numeric parts
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'MTEST' },
          { code: 'M' }
        ])
      };
      MockedMedicine.find.mockReturnValue(mockFind as any);

      const result = await generateNextMedicineCode();

      expect(result.success).toBe(true);
      expect(result.code).toBe('M10001');
    });
  });

  describe('generateProductCodeByHealthInsurance', () => {
    it('應該為有健保代碼的產品生成M開頭編號', async () => {
      // Mock no existing products/medicines
      const mockProductFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };
      const mockMedicineFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };
      
      MockedProduct.find.mockReturnValue(mockProductFind as any);
      MockedMedicine.find.mockReturnValue(mockMedicineFind as any);

      const result = await generateProductCodeByHealthInsurance(true);

      expect(result.success).toBe(true);
      expect(result.code).toBe('M10001');
      expect(result.metadata?.charset).toBe('M + digits');
    });

    it('應該為沒有健保代碼的產品生成P開頭編號', async () => {
      // Mock no existing products/medicines
      const mockProductFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };
      const mockMedicineFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };
      
      MockedProduct.find.mockReturnValue(mockProductFind as any);
      MockedMedicine.find.mockReturnValue(mockMedicineFind as any);

      const result = await generateProductCodeByHealthInsurance(false);

      expect(result.success).toBe(true);
      expect(result.code).toBe('P10001');
      expect(result.metadata?.charset).toBe('P + digits');
    });

    it('應該從兩個集合中查找最大編號', async () => {
      // Mock existing products and medicines
      const mockProductFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'M10001' },
          { code: 'M10003' }
        ])
      };
      const mockMedicineFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'M10002' },
          { code: 'M10005' }
        ])
      };
      
      MockedProduct.find.mockReturnValue(mockProductFind as any);
      MockedMedicine.find.mockReturnValue(mockMedicineFind as any);

      const result = await generateProductCodeByHealthInsurance(true);

      expect(result.success).toBe(true);
      expect(result.code).toBe('M10006'); // Should find max from both collections
    });

    it('應該處理混合的前綴', async () => {
      // Mock products with different prefixes - Product 集合只有 P10001，Medicine 集合有 M 開頭的
      const mockProductFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]) // Product 集合中沒有 M 開頭的編號
      };
      const mockMedicineFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'M10001' },
          { code: 'M10002' }
        ])
      };
      
      MockedProduct.find.mockReturnValue(mockProductFind as any);
      MockedMedicine.find.mockReturnValue(mockMedicineFind as any);

      const result = await generateProductCodeByHealthInsurance(true);

      expect(result.success).toBe(true);
      expect(result.code).toBe('M10003'); // Should only consider M prefix
    });

    it('應該處理數據庫錯誤', async () => {
      // Mock database error
      MockedProduct.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await generateProductCodeByHealthInsurance(true);

      expect(result.success).toBe(false);
      expect(result.code).toMatch(/^M\d+$/);
      expect(result.error).toBe('Database error');
    });

    it('應該處理Promise.all錯誤', async () => {
      // Mock one successful and one failed query
      const mockProductFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };
      
      MockedProduct.find.mockReturnValue(mockProductFind as any);
      MockedMedicine.find.mockImplementation(() => {
        throw new Error('Medicine query failed');
      });

      const result = await generateProductCodeByHealthInsurance(false);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Medicine query failed');
    });

    it('應該處理空的查詢結果', async () => {
      // Mock empty results
      const mockProductFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };
      const mockMedicineFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };
      
      MockedProduct.find.mockReturnValue(mockProductFind as any);
      MockedMedicine.find.mockReturnValue(mockMedicineFind as any);

      const result = await generateProductCodeByHealthInsurance(true);

      expect(result.success).toBe(true);
      expect(result.code).toBe('M10001');
    });

    it('應該處理無效的代碼格式', async () => {
      // Mock products with invalid codes
      const mockProductFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'INVALID' },
          { code: null },
          { code: undefined }
        ])
      };
      const mockMedicineFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'M10001' }
        ])
      };
      
      MockedProduct.find.mockReturnValue(mockProductFind as any);
      MockedMedicine.find.mockReturnValue(mockMedicineFind as any);

      const result = await generateProductCodeByHealthInsurance(true);

      expect(result.success).toBe(true);
      expect(result.code).toBe('M10002');
    });
  });

  describe('edge cases', () => {
    it('應該處理非常大的數字', async () => {
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'P999999999' }
        ])
      };
      MockedProduct.find.mockReturnValue(mockFind as any);

      const result = await generateNextProductCode();

      expect(result.success).toBe(true);
      expect(result.code).toBe('P1000000000');
    });

    it('應該處理零開頭的數字', async () => {
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'P00001' },
          { code: 'P00010' }
        ])
      };
      MockedProduct.find.mockReturnValue(mockFind as any);

      const result = await generateNextProductCode();

      expect(result.success).toBe(true);
      expect(result.code).toBe('P11'); // parseInt will handle leading zeros
    });

    it('應該處理負數（雖然不太可能）', async () => {
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { code: 'P-123' } // Invalid but should be filtered out
        ])
      };
      MockedProduct.find.mockReturnValue(mockFind as any);

      const result = await generateNextProductCode();

      expect(result.success).toBe(true);
      expect(result.code).toBe('P10001'); // Should default to P10001
    });

    it('應該處理字串錯誤', async () => {
      MockedProduct.find.mockImplementation(() => {
        throw 'String error instead of Error object';
      });

      const result = await generateNextProductCode();

      expect(result.success).toBe(false);
      expect(result.error).toBe('未知錯誤');
    });
  });
});