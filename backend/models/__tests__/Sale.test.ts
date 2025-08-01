import mongoose from 'mongoose';
import Sale from '../Sale';

describe('Sale Model', () => {
  beforeEach(async () => {
    // 清理測試數據
    await Sale.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('應該成功創建有效的銷售記錄', async () => {
      const saleData = {
        saleNumber: 'SALE001',
        customer: new mongoose.Types.ObjectId(),
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 2,
            price: 50,
            subtotal: 100
          },
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 30,
            subtotal: 30
          }
        ],
        totalAmount: 130,
        discount: 10,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        note: '測試銷售',
        cashier: new mongoose.Types.ObjectId()
      };

      const sale = new Sale(saleData);
      const savedSale = await sale.save();

      expect(savedSale._id).toBeDefined();
      expect(savedSale.saleNumber).toBe(saleData.saleNumber);
      expect(savedSale.customer).toEqual(saleData.customer);
      expect(savedSale.items).toHaveLength(2);
      expect(savedSale.items[0].quantity).toBe(2);
      expect(savedSale.items[0].price).toBe(50);
      expect(savedSale.items[0].subtotal).toBe(100);
      expect(savedSale.totalAmount).toBe(saleData.totalAmount);
      expect(savedSale.discount).toBe(saleData.discount);
      expect(savedSale.paymentMethod).toBe(saleData.paymentMethod);
      expect(savedSale.paymentStatus).toBe(saleData.paymentStatus);
      expect(savedSale.note).toBe(saleData.note);
      expect(savedSale.cashier).toEqual(saleData.cashier);
      expect((savedSale as any).createdAt).toBeDefined();
      expect((savedSale as any).updatedAt).toBeDefined();
    });

    it('應該要求必填欄位', async () => {
      const sale = new Sale({});
      
      await expect(sale.save()).rejects.toThrow();
    });

    it('應該要求總金額', async () => {
      const saleData = {
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 50,
            subtotal: 50
          }
        ]
      };

      const sale = new Sale(saleData);
      await expect(sale.save()).rejects.toThrow(/totalAmount.*required/i);
    });

    it('應該確保銷售編號唯一性', async () => {
      const saleData1 = {
        saleNumber: 'SALE001',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 50,
            subtotal: 50
          }
        ],
        totalAmount: 50
      };

      const saleData2 = {
        saleNumber: 'SALE001', // 相同編號
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 30,
            subtotal: 30
          }
        ],
        totalAmount: 30
      };

      await new Sale(saleData1).save();
      
      const sale2 = new Sale(saleData2);
      await expect(sale2.save()).rejects.toThrow(/duplicate key/i);
    });

    it('應該驗證付款方式枚舉值', async () => {
      const saleData = {
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 50,
            subtotal: 50
          }
        ],
        totalAmount: 50,
        paymentMethod: 'invalid_method' as any
      };

      const sale = new Sale(saleData);
      await expect(sale.save()).rejects.toThrow();
    });

    it('應該驗證付款狀態枚舉值', async () => {
      const saleData = {
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 50,
            subtotal: 50
          }
        ],
        totalAmount: 50,
        paymentStatus: 'invalid_status' as any
      };

      const sale = new Sale(saleData);
      await expect(sale.save()).rejects.toThrow();
    });

    it('應該設置默認值', async () => {
      const saleData = {
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 50,
            subtotal: 50
          }
        ],
        totalAmount: 50
      };

      const sale = new Sale(saleData);
      const savedSale = await sale.save();
      
      expect(savedSale.discount).toBe(0);
      expect(savedSale.paymentMethod).toBe('cash');
      expect(savedSale.paymentStatus).toBe('paid');
      expect(savedSale.date).toBeDefined();
    });

    it('應該要求商品項目的必填欄位', async () => {
      const saleData = {
        items: [
          {
            // 缺少 product
            quantity: 1,
            price: 50,
            subtotal: 50
          }
        ],
        totalAmount: 50
      };

      const sale = new Sale(saleData);
      await expect(sale.save()).rejects.toThrow(/product.*required/i);
    });
  });

  describe('Instance Methods', () => {
    let sale: any;

    beforeEach(async () => {
      sale = await Sale.create({
        saleNumber: 'SALE001',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 2,
            price: 50,
            subtotal: 100
          },
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 30,
            subtotal: 30
          }
        ],
        totalAmount: 130,
        discount: 10
      });
    });

    describe('calculateTotalAmount', () => {
      it('應該計算正確的總金額', () => {
        const calculatedTotal = sale.calculateTotalAmount();
        
        // 商品小計總和 (100 + 30) - 折扣 (10) = 120
        expect(calculatedTotal).toBe(120);
      });

      it('應該處理沒有折扣的情況', async () => {
        const saleWithoutDiscount = await Sale.create({
          saleNumber: 'SALE002',
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              quantity: 1,
              price: 100,
              subtotal: 100
            }
          ],
          totalAmount: 100
        });

        const calculatedTotal = saleWithoutDiscount.calculateTotalAmount();
        expect(calculatedTotal).toBe(100);
      });

      it('應該處理null折扣', async () => {
        sale.discount = null;
        const calculatedTotal = sale.calculateTotalAmount();
        
        // 商品小計總和 (100 + 30) - 折扣 (0) = 130
        expect(calculatedTotal).toBe(130);
      });
    });

    describe('validateItemSubtotals', () => {
      it('應該驗證正確的商品小計', () => {
        const isValid = sale.validateItemSubtotals();
        expect(isValid).toBe(true);
      });

      it('應該檢測錯誤的商品小計', async () => {
        const saleWithWrongSubtotal = await Sale.create({
          saleNumber: 'SALE003',
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              quantity: 2,
              price: 50,
              subtotal: 90 // 錯誤：應該是 100
            }
          ],
          totalAmount: 90
        });

        const isValid = saleWithWrongSubtotal.validateItemSubtotals();
        expect(isValid).toBe(false);
      });

      it('應該容許小數點誤差', async () => {
        const saleWithRounding = await Sale.create({
          saleNumber: 'SALE004',
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              quantity: 3,
              price: 33.33,
              subtotal: 99.99 // 實際應該是 99.99，允許小誤差
            }
          ],
          totalAmount: 99.99
        });

        const isValid = saleWithRounding.validateItemSubtotals();
        expect(isValid).toBe(true);
      });
    });
  });

  describe('Virtual Properties', () => {
    let sale: any;

    beforeEach(async () => {
      sale = await Sale.create({
        saleNumber: 'SALE001',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 100,
            subtotal: 100
          }
        ],
        totalAmount: 100,
        discount: 15
      });
    });

    describe('finalAmount', () => {
      it('應該計算最終金額', () => {
        expect(sale.finalAmount).toBe(85); // 100 - 15
      });

      it('應該處理沒有折扣的情況', async () => {
        const saleWithoutDiscount = await Sale.create({
          saleNumber: 'SALE002',
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              quantity: 1,
              price: 100,
              subtotal: 100
            }
          ],
          totalAmount: 100
        });

        expect(saleWithoutDiscount.finalAmount).toBe(100);
      });
    });

    describe('saleDate', () => {
      it('應該返回銷售日期', () => {
        expect(sale.saleDate).toEqual(sale.date);
        expect(sale.saleDate).toBeInstanceOf(Date);
      });
    });
  });

  describe('JSON Serialization', () => {
    it('應該在JSON序列化時包含虛擬屬性', async () => {
      const sale = await Sale.create({
        saleNumber: 'SALE001',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 100,
            subtotal: 100
          }
        ],
        totalAmount: 100,
        discount: 20
      });

      const saleJSON = sale.toJSON();
      
      expect(saleJSON.finalAmount).toBe(80);
      expect(saleJSON.saleDate).toEqual(sale.date);
    });

    it('應該在Object轉換時包含虛擬屬性', async () => {
      const sale = await Sale.create({
        saleNumber: 'SALE001',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 100,
            subtotal: 100
          }
        ],
        totalAmount: 100,
        discount: 25
      });

      const saleObject = sale.toObject();
      
      expect(saleObject.finalAmount).toBe(75);
      expect(saleObject.saleDate).toEqual(sale.date);
    });
  });

  describe('Timestamps', () => {
    it('應該自動設置createdAt和updatedAt', async () => {
      const saleData = {
        saleNumber: 'SALE001',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 50,
            subtotal: 50
          }
        ],
        totalAmount: 50
      };

      const sale = new Sale(saleData);
      const savedSale = await sale.save();
      
      expect((savedSale as any).createdAt).toBeDefined();
      expect((savedSale as any).updatedAt).toBeDefined();
      expect((savedSale as any).createdAt).toBeInstanceOf(Date);
      expect((savedSale as any).updatedAt).toBeInstanceOf(Date);
    });

    it('應該在更新時更新updatedAt', async () => {
      const saleData = {
        saleNumber: 'SALE001',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 50,
            subtotal: 50
          }
        ],
        totalAmount: 50
      };

      const sale = await new Sale(saleData).save();
      const originalUpdatedAt = (sale as any).updatedAt;
      
      // 等待一毫秒確保時間差異
      await new Promise(resolve => setTimeout(resolve, 1));
      
      sale.note = '更新的備註';
      const updatedSale = await sale.save();
      
      expect((updatedSale as any).updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      // 創建測試數據
      await Sale.create([
        {
          saleNumber: 'SALE001',
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              quantity: 1,
              price: 100,
              subtotal: 100
            }
          ],
          totalAmount: 100,
          paymentMethod: 'cash',
          paymentStatus: 'paid',
          date: new Date('2024-01-01')
        },
        {
          saleNumber: 'SALE002',
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              quantity: 2,
              price: 50,
              subtotal: 100
            }
          ],
          totalAmount: 100,
          paymentMethod: 'credit_card',
          paymentStatus: 'pending',
          date: new Date('2024-01-02')
        },
        {
          saleNumber: 'SALE003',
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              quantity: 1,
              price: 200,
              subtotal: 200
            }
          ],
          totalAmount: 200,
          paymentMethod: 'cash',
          paymentStatus: 'paid',
          date: new Date('2024-01-03')
        }
      ]);
    });

    it('應該能夠按付款方式查詢', async () => {
      const cashSales = await Sale.find({ paymentMethod: 'cash' });
      expect(cashSales).toHaveLength(2);
    });

    it('應該能夠按付款狀態查詢', async () => {
      const paidSales = await Sale.find({ paymentStatus: 'paid' });
      expect(paidSales).toHaveLength(2);
      
      const pendingSales = await Sale.find({ paymentStatus: 'pending' });
      expect(pendingSales).toHaveLength(1);
    });

    it('應該能夠按銷售編號查詢', async () => {
      const sale = await Sale.findOne({ saleNumber: 'SALE002' });
      expect(sale).toBeTruthy();
      expect(sale?.paymentMethod).toBe('credit_card');
    });

    it('應該能夠按金額範圍查詢', async () => {
      const highValueSales = await Sale.find({ 
        totalAmount: { $gte: 150 } 
      });
      expect(highValueSales).toHaveLength(1);
      expect(highValueSales[0].saleNumber).toBe('SALE003');
    });

    it('應該能夠按日期範圍查詢', async () => {
      const salesInRange = await Sale.find({
        date: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-01-02')
        }
      });
      expect(salesInRange).toHaveLength(2);
    });
  });

  describe('Complex Scenarios', () => {
    it('應該處理多商品的複雜銷售', async () => {
      const complexSale = await Sale.create({
        saleNumber: 'SALE_COMPLEX',
        customer: new mongoose.Types.ObjectId(),
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 3,
            price: 25.50,
            subtotal: 76.50
          },
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 150.00,
            subtotal: 150.00
          },
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 2,
            price: 33.25,
            subtotal: 66.50
          }
        ],
        totalAmount: 293.00,
        discount: 23.00,
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        note: '複雜銷售測試',
        cashier: new mongoose.Types.ObjectId()
      });

      expect(complexSale.items).toHaveLength(3);
      expect(complexSale.calculateTotalAmount()).toBe(270.00); // 293 - 23
      expect(complexSale.validateItemSubtotals()).toBe(true);
      expect(complexSale.finalAmount).toBe(270.00);
    });

    it('應該處理銷售記錄的完整生命週期', async () => {
      // 創建新銷售
      const sale = await Sale.create({
        saleNumber: 'SALE_LIFECYCLE',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 100,
            subtotal: 100
          }
        ],
        totalAmount: 100,
        paymentStatus: 'pending'
      });

      expect(sale.paymentStatus).toBe('pending');

      // 更新付款狀態
      sale.paymentStatus = 'paid';
      sale.paymentMethod = 'cash';
      sale.note = '現金付款完成';
      await sale.save();

      expect(sale.paymentStatus).toBe('paid');
      expect(sale.paymentMethod).toBe('cash');
      expect(sale.note).toBe('現金付款完成');

      // 驗證計算
      expect(sale.calculateTotalAmount()).toBe(100);
      expect(sale.validateItemSubtotals()).toBe(true);
    });

    it('應該處理退貨情況（負數量）', async () => {
      const refundSale = await Sale.create({
        saleNumber: 'REFUND001',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: -1, // 退貨
            price: 50,
            subtotal: -50
          }
        ],
        totalAmount: -50,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        note: '商品退貨'
      });

      expect(refundSale.items[0].quantity).toBe(-1);
      expect(refundSale.items[0].subtotal).toBe(-50);
      expect(refundSale.totalAmount).toBe(-50);
      expect(refundSale.calculateTotalAmount()).toBe(-50);
      expect(refundSale.validateItemSubtotals()).toBe(true);
    });
  });
});