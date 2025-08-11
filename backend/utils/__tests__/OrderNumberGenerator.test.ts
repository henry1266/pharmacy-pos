import OrderNumberGenerator, { OrderNumberGeneratorOptions } from '../OrderNumberGenerator';
import { Model } from 'mongoose';

// Mock Mongoose Model
const mockModel = {
  findOne: jest.fn(),
  find: jest.fn(), // 添加 find 方法
  sort: jest.fn(),
  lean: jest.fn()
} as unknown as Model<any>;

describe('OrderNumberGenerator', () => {
  let generator: OrderNumberGenerator;
  const mockOptions: OrderNumberGeneratorOptions = {
    Model: mockModel,
    field: 'orderNumber',
    prefix: 'SO',
    useShortYear: false,
    sequenceDigits: 3,
    sequenceStart: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    generator = new OrderNumberGenerator(mockOptions);
  });

  describe('constructor', () => {
    it('應該成功創建生成器實例', () => {
      expect(generator).toBeInstanceOf(OrderNumberGenerator);
    });

    it('應該在缺少必要參數時拋出錯誤', () => {
      expect(() => {
        new OrderNumberGenerator({
          Model: null as any,
          field: 'orderNumber'
        });
      }).toThrow('Mongoose模型實例和字段名稱為必填項');

      expect(() => {
        new OrderNumberGenerator({
          Model: mockModel,
          field: ''
        });
      }).toThrow('Mongoose模型實例和字段名稱為必填項');
    });

    it('應該在序號位數無效時拋出錯誤', () => {
      expect(() => {
        new OrderNumberGenerator({
          Model: mockModel,
          field: 'orderNumber',
          sequenceDigits: 0
        });
      }).toThrow('序號位數必須大於0');

      expect(() => {
        new OrderNumberGenerator({
          Model: mockModel,
          field: 'orderNumber',
          sequenceDigits: -1
        });
      }).toThrow('序號位數必須大於0');
    });

    it('應該使用默認值', () => {
      const simpleGenerator = new OrderNumberGenerator({
        Model: mockModel,
        field: 'orderNumber'
      });
      expect(simpleGenerator).toBeInstanceOf(OrderNumberGenerator);
    });
  });

  describe('generateDatePrefix', () => {
    it('應該生成正確的日期前綴（完整年份）', () => {
      // Mock Date to return a specific date
      const mockDate = new Date('2024-03-15');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const prefix = generator.generateDatePrefix();
      expect(prefix).toBe('SO20240315');

      // Restore Date
      (global.Date as any).mockRestore();
    });

    it('應該生成正確的日期前綴（短年份）', () => {
      const shortYearGenerator = new OrderNumberGenerator({
        ...mockOptions,
        useShortYear: true
      });

      const mockDate = new Date('2024-03-15');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const prefix = shortYearGenerator.generateDatePrefix();
      expect(prefix).toBe('SO240315');

      (global.Date as any).mockRestore();
    });

    it('應該生成沒有前綴的日期前綴', () => {
      const noPrefixGenerator = new OrderNumberGenerator({
        ...mockOptions,
        prefix: ''
      });

      const mockDate = new Date('2024-03-15');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const prefix = noPrefixGenerator.generateDatePrefix();
      expect(prefix).toBe('20240315');

      (global.Date as any).mockRestore();
    });

    it('應該正確處理單位數的月份和日期', () => {
      const mockDate = new Date('2024-01-05');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const prefix = generator.generateDatePrefix();
      expect(prefix).toBe('SO20240105');

      (global.Date as any).mockRestore();
    });
  });

  describe('generate', () => {
    beforeEach(() => {
      // Mock Date to return a consistent date
      const mockDate = new Date('2024-03-15');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    });

    afterEach(() => {
      (global.Date as any).mockRestore();
    });

    it('應該生成第一個訂單號', async () => {
      // Mock no existing orders
      const mockQuery = {
        lean: jest.fn().mockResolvedValue([])
      };
      (mockModel.find as jest.Mock).mockReturnValue(mockQuery);

      const orderNumber = await generator.generate();
      expect(orderNumber).toBe('SO20240315001');
    });

    it('應該生成下一個序號', async () => {
      // Mock existing order
      const mockQuery = {
        lean: jest.fn().mockResolvedValue([{
          orderNumber: 'SO20240315005'
        }])
      };
      (mockModel.find as jest.Mock).mockReturnValue(mockQuery);

      const orderNumber = await generator.generate();
      expect(orderNumber).toBe('SO20240315006');
    });

    it('應該處理序號進位', async () => {
      // Mock existing order with max sequence
      const mockQuery = {
        lean: jest.fn().mockResolvedValue([{
          orderNumber: 'SO20240315999'
        }])
      };
      (mockModel.find as jest.Mock).mockReturnValue(mockQuery);

      const orderNumber = await generator.generate();
      expect(orderNumber).toBe('SO20240315001'); // Should wrap around
    });

    it('應該處理不同的序號位數', async () => {
      const fiveDigitGenerator = new OrderNumberGenerator({
        ...mockOptions,
        sequenceDigits: 5
      });

      const mockQuery = {
        lean: jest.fn().mockResolvedValue([])
      };
      (mockModel.find as jest.Mock).mockReturnValue(mockQuery);

      const orderNumber = await fiveDigitGenerator.generate();
      expect(orderNumber).toBe('SO2024031500001');
    });

    it('應該處理複雜的訂單號格式', async () => {
      // Mock existing order with complex format
      const mockQuery = {
        lean: jest.fn().mockResolvedValue([{
          orderNumber: 'SO20240315-ABC-010'
        }])
      };
      (mockModel.find as jest.Mock).mockReturnValue(mockQuery);

      const orderNumber = await generator.generate();
      expect(orderNumber).toBe('SO20240315011'); // Should extract last 3 digits
    });

    it('應該處理無效的序號格式', async () => {
      // Mock existing order with invalid sequence
      const mockQuery = {
        lean: jest.fn().mockResolvedValue([{
          orderNumber: 'SO20240315ABC'
        }])
      };
      (mockModel.find as jest.Mock).mockReturnValue(mockQuery);

      const orderNumber = await generator.generate();
      expect(orderNumber).toBe('SO20240315001'); // Should use default sequence
    });

    it('應該處理數據庫錯誤', async () => {
      (mockModel.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(generator.generate()).rejects.toThrow('Database error');
    });

    it('應該使用自定義起始序號', async () => {
      const customStartGenerator = new OrderNumberGenerator({
        ...mockOptions,
        sequenceStart: 100
      });

      const mockQuery = {
        lean: jest.fn().mockResolvedValue([])
      };
      (mockModel.find as jest.Mock).mockReturnValue(mockQuery);

      const orderNumber = await customStartGenerator.generate();
      expect(orderNumber).toBe('SO20240315100');
    });
  });

  describe('exists', () => {
    it('應該檢測存在的訂單號', async () => {
      (mockModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ orderNumber: 'SO20240315001' })
      });

      const exists = await generator.exists('SO20240315001');
      expect(exists).toBe(true);
    });

    it('應該檢測不存在的訂單號', async () => {
      (mockModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      const exists = await generator.exists('SO20240315999');
      expect(exists).toBe(false);
    });

    it('應該處理數據庫錯誤', async () => {
      (mockModel.findOne as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(generator.exists('SO20240315001')).rejects.toThrow('Database error');
    });
  });

  describe('generateUnique', () => {
    it('應該返回唯一的訂單號', async () => {
      // Mock that the base order number doesn't exist
      (mockModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      const uniqueNumber = await generator.generateUnique('SO20240315001');
      expect(uniqueNumber).toBe('SO20240315001');
    });

    it('應該生成帶後綴的唯一訂單號', async () => {
      // Mock that base exists, but with suffix doesn't
      (mockModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue({ orderNumber: 'SO20240315001' })
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue({ orderNumber: 'SO20240315001-1' })
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue(null)
        });

      const uniqueNumber = await generator.generateUnique('SO20240315001');
      expect(uniqueNumber).toBe('SO20240315001-2');
    });

    it('應該在達到最大嘗試次數時拋出錯誤', async () => {
      // Mock that all attempts return existing orders
      (mockModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ orderNumber: 'exists' })
      });

      await expect(generator.generateUnique('SO20240315001'))
        .rejects.toThrow('無法生成唯一訂單號，已達到最大嘗試次數');
    });

    it('應該處理數據庫錯誤', async () => {
      (mockModel.findOne as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(generator.generateUnique('SO20240315001'))
        .rejects.toThrow('Database error');
    });
  });

  describe('integration scenarios', () => {
    it('應該處理跨日期的訂單生成', async () => {
      // Test different dates
      const dates = [
        { date: new Date('2024-01-01'), expected: 'SO20240101001' },
        { date: new Date('2024-12-31'), expected: 'SO20241231001' },
        { date: new Date('2024-02-29'), expected: 'SO20240229001' } // Leap year
      ];

      for (const { date, expected } of dates) {
        jest.spyOn(global, 'Date').mockImplementation(() => date);
        
        const mockQuery = {
          lean: jest.fn().mockResolvedValue([])
        };
        (mockModel.find as jest.Mock).mockReturnValue(mockQuery);

        const orderNumber = await generator.generate();
        expect(orderNumber).toBe(expected);

        (global.Date as any).mockRestore();
      }
    });

    it('應該處理不同配置的生成器', async () => {
      const configs = [
        {
          options: { Model: mockModel, field: 'poid', prefix: 'PO', useShortYear: true, sequenceDigits: 4 },
          expected: 'PO2403150001'
        },
        {
          options: { Model: mockModel, field: 'saleNumber', prefix: '', useShortYear: false, sequenceDigits: 5 },
          expected: '2024031500001'
        }
      ];

      const mockDate = new Date('2024-03-15');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      for (const { options, expected } of configs) {
        const testGenerator = new OrderNumberGenerator(options);
        
        const mockQuery = {
          lean: jest.fn().mockResolvedValue([])
        };
        (mockModel.find as jest.Mock).mockReturnValue(mockQuery);

        const orderNumber = await testGenerator.generate();
        expect(orderNumber).toBe(expected);
      }

      (global.Date as any).mockRestore();
    });
  });
});