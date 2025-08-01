import {
  matchFIFOBatches,
  calculateProfitMargins,
  prepareInventoryForFIFO,
  calculateProductFIFO,
  StockInRecord,
  StockOutRecord,
  SaleRecord,
  InventoryRecord,
  OutgoingUsage
} from '../fifoCalculator';
import { Types } from 'mongoose';

describe('fifoCalculator', () => {
  describe('matchFIFOBatches', () => {
    it('應該正確匹配簡單的FIFO批次', () => {
      const stockIn: StockInRecord[] = [
        {
          timestamp: new Date('2024-01-01'),
          quantity: 100,
          unit_price: 10,
          drug_id: 'drug1',
          source_id: 'source1',
          orderNumber: 'PO001',
          orderId: 'order1',
          orderType: 'purchase'
        }
      ];

      const stockOut: StockOutRecord[] = [
        {
          timestamp: new Date('2024-01-02'),
          quantity: 50,
          drug_id: 'drug1',
          source_id: 'source2',
          type: 'sale',
          orderNumber: 'SO001',
          orderId: 'sale1',
          orderType: 'sale'
        }
      ];

      const result = matchFIFOBatches(stockIn, stockOut);

      expect(result).toHaveLength(1);
      expect(result[0].totalQuantity).toBe(50);
      expect(result[0].costParts).toHaveLength(1);
      expect(result[0].costParts[0].quantity).toBe(50);
      expect(result[0].costParts[0].unit_price).toBe(10);
      expect(result[0].hasNegativeInventory).toBe(false);
    });

    it('應該處理多批次進貨的FIFO匹配', () => {
      const stockIn: StockInRecord[] = [
        {
          timestamp: new Date('2024-01-01'),
          quantity: 50,
          unit_price: 10,
          drug_id: 'drug1',
          source_id: 'source1',
          orderNumber: 'PO001',
          orderId: 'order1',
          orderType: 'purchase'
        },
        {
          timestamp: new Date('2024-01-02'),
          quantity: 30,
          unit_price: 12,
          drug_id: 'drug1',
          source_id: 'source2',
          orderNumber: 'PO002',
          orderId: 'order2',
          orderType: 'purchase'
        }
      ];

      const stockOut: StockOutRecord[] = [
        {
          timestamp: new Date('2024-01-03'),
          quantity: 70,
          drug_id: 'drug1',
          source_id: 'source3',
          type: 'sale',
          orderNumber: 'SO001',
          orderId: 'sale1',
          orderType: 'sale'
        }
      ];

      const result = matchFIFOBatches(stockIn, stockOut);

      expect(result).toHaveLength(1);
      expect(result[0].totalQuantity).toBe(70);
      expect(result[0].costParts).toHaveLength(2);
      
      // 第一批次應該完全用完
      expect(result[0].costParts[0].quantity).toBe(50);
      expect(result[0].costParts[0].unit_price).toBe(10);
      
      // 第二批次應該用掉20個
      expect(result[0].costParts[1].quantity).toBe(20);
      expect(result[0].costParts[1].unit_price).toBe(12);
    });

    it('應該處理負庫存情況', () => {
      const stockIn: StockInRecord[] = [
        {
          timestamp: new Date('2024-01-02'),
          quantity: 30,
          unit_price: 10,
          drug_id: 'drug1',
          source_id: 'source1',
          orderNumber: 'PO001',
          orderId: 'order1',
          orderType: 'purchase'
        }
      ];

      const stockOut: StockOutRecord[] = [
        {
          timestamp: new Date('2024-01-01'),
          quantity: 50,
          drug_id: 'drug1',
          source_id: 'source2',
          type: 'sale',
          orderNumber: 'SO001',
          orderId: 'sale1',
          orderType: 'sale'
        }
      ];

      const result = matchFIFOBatches(stockIn, stockOut);

      expect(result).toHaveLength(1);
      expect(result[0].hasNegativeInventory).toBe(true);
      expect(result[0].remainingNegativeQuantity).toBe(20);
      expect(result[0].costParts).toHaveLength(0);
    });

    it('應該處理空的進貨或出貨記錄', () => {
      const stockIn: StockInRecord[] = [];
      const stockOut: StockOutRecord[] = [
        {
          timestamp: new Date('2024-01-01'),
          quantity: 50,
          drug_id: 'drug1',
          source_id: 'source1',
          type: 'sale',
          orderNumber: 'SO001',
          orderId: 'sale1',
          orderType: 'sale'
        }
      ];

      const result = matchFIFOBatches(stockIn, stockOut);

      expect(result).toHaveLength(1);
      expect(result[0].hasNegativeInventory).toBe(true);
      expect(result[0].costParts).toHaveLength(0);
    });

    it('應該處理多筆出貨記錄', () => {
      const stockIn: StockInRecord[] = [
        {
          timestamp: new Date('2024-01-01'),
          quantity: 100,
          unit_price: 10,
          drug_id: 'drug1',
          source_id: 'source1',
          orderNumber: 'PO001',
          orderId: 'order1',
          orderType: 'purchase'
        }
      ];

      const stockOut: StockOutRecord[] = [
        {
          timestamp: new Date('2024-01-02'),
          quantity: 30,
          drug_id: 'drug1',
          source_id: 'source2',
          type: 'sale',
          orderNumber: 'SO001',
          orderId: 'sale1',
          orderType: 'sale'
        },
        {
          timestamp: new Date('2024-01-03'),
          quantity: 40,
          drug_id: 'drug1',
          source_id: 'source3',
          type: 'sale',
          orderNumber: 'SO002',
          orderId: 'sale2',
          orderType: 'sale'
        }
      ];

      const result = matchFIFOBatches(stockIn, stockOut);

      expect(result).toHaveLength(2);
      expect(result[0].totalQuantity).toBe(30);
      expect(result[1].totalQuantity).toBe(40);
      expect(result[0].costParts[0].quantity).toBe(30);
      expect(result[1].costParts[0].quantity).toBe(40);
    });
  });

  describe('calculateProfitMargins', () => {
    it('應該計算正常的銷售毛利', () => {
      const usageLog: OutgoingUsage[] = [
        {
          outTime: new Date('2024-01-02'),
          drug_id: 'drug1',
          totalQuantity: 50,
          costParts: [
            {
              batchTime: new Date('2024-01-01'),
              unit_price: 10,
              quantity: 50,
              orderNumber: 'PO001',
              orderId: 'order1',
              orderType: 'purchase'
            }
          ],
          orderNumber: 'SO001',
          orderId: 'sale1',
          orderType: 'sale',
          hasNegativeInventory: false,
          remainingNegativeQuantity: 0
        }
      ];

      const sales: SaleRecord[] = [
        {
          drug_id: 'drug1',
          timestamp: new Date('2024-01-02'),
          unit_price: 15
        }
      ];

      const result = calculateProfitMargins(usageLog, sales);

      expect(result).toHaveLength(1);
      expect(result[0].totalCost).toBe(500); // 50 * 10
      expect(result[0].totalRevenue).toBe(750); // 50 * 15
      expect(result[0].grossProfit).toBe(250); // 750 - 500
      expect(result[0].profitMargin).toBe('33.33%'); // (250/750) * 100
    });

    it('應該處理負庫存的毛利計算', () => {
      const usageLog: OutgoingUsage[] = [
        {
          outTime: new Date('2024-01-01'),
          drug_id: 'drug1',
          totalQuantity: 50,
          costParts: [],
          orderNumber: 'SO001',
          orderId: 'sale1',
          orderType: 'sale',
          hasNegativeInventory: true,
          remainingNegativeQuantity: 50
        }
      ];

      const sales: SaleRecord[] = [
        {
          drug_id: 'drug1',
          timestamp: new Date('2024-01-01'),
          unit_price: 15
        }
      ];

      const result = calculateProfitMargins(usageLog, sales);

      expect(result).toHaveLength(1);
      expect(result[0].grossProfit).toBe(0);
      expect(result[0].profitMargin).toBe('0.00%');
      expect(result[0].hasNegativeInventory).toBe(true);
      expect(result[0].pendingProfitCalculation).toBe(true);
    });

    it('應該處理多批次成本的毛利計算', () => {
      const usageLog: OutgoingUsage[] = [
        {
          outTime: new Date('2024-01-03'),
          drug_id: 'drug1',
          totalQuantity: 70,
          costParts: [
            {
              batchTime: new Date('2024-01-01'),
              unit_price: 10,
              quantity: 50,
              orderNumber: 'PO001',
              orderId: 'order1',
              orderType: 'purchase'
            },
            {
              batchTime: new Date('2024-01-02'),
              unit_price: 12,
              quantity: 20,
              orderNumber: 'PO002',
              orderId: 'order2',
              orderType: 'purchase'
            }
          ],
          orderNumber: 'SO001',
          orderId: 'sale1',
          orderType: 'sale',
          hasNegativeInventory: false,
          remainingNegativeQuantity: 0
        }
      ];

      const sales: SaleRecord[] = [
        {
          drug_id: 'drug1',
          timestamp: new Date('2024-01-03'),
          unit_price: 15
        }
      ];

      const result = calculateProfitMargins(usageLog, sales);

      expect(result).toHaveLength(1);
      expect(result[0].totalCost).toBe(740); // (50 * 10) + (20 * 12)
      expect(result[0].totalRevenue).toBe(1050); // 70 * 15
      expect(result[0].grossProfit).toBe(310); // 1050 - 740
    });

    it('應該過濾沒有對應銷售記錄的使用記錄', () => {
      const usageLog: OutgoingUsage[] = [
        {
          outTime: new Date('2024-01-02'),
          drug_id: 'drug1',
          totalQuantity: 50,
          costParts: [],
          orderNumber: 'SO001',
          orderId: 'sale1',
          orderType: 'sale',
          hasNegativeInventory: false,
          remainingNegativeQuantity: 0
        }
      ];

      const sales: SaleRecord[] = []; // 沒有銷售記錄

      const result = calculateProfitMargins(usageLog, sales);

      expect(result).toHaveLength(0);
    });
  });

  describe('prepareInventoryForFIFO', () => {
    it('應該正確轉換庫存記錄', () => {
      const inventories: InventoryRecord[] = [
        {
          _id: new Types.ObjectId(),
          product: new Types.ObjectId(),
          quantity: 100,
          totalAmount: 1000,
          type: 'purchase',
          lastUpdated: new Date('2024-01-01'),
          purchaseOrderNumber: 'PO001',
          purchaseOrderId: new Types.ObjectId()
        },
        {
          _id: new Types.ObjectId(),
          product: new Types.ObjectId(),
          quantity: -50,
          totalAmount: 750,
          type: 'sale',
          lastUpdated: new Date('2024-01-02'),
          saleNumber: 'SO001',
          saleId: new Types.ObjectId()
        }
      ];

      const result = prepareInventoryForFIFO(inventories);

      expect(result.stockIn).toHaveLength(1);
      expect(result.stockOut).toHaveLength(1);
      
      expect(result.stockIn[0].quantity).toBe(100);
      expect(result.stockIn[0].unit_price).toBe(10); // 1000 / 100
      expect(result.stockIn[0].orderType).toBe('purchase');
      
      expect(result.stockOut[0].quantity).toBe(50); // Math.abs(-50)
      expect(result.stockOut[0].orderType).toBe('sale');
    });

    it('應該處理出貨記錄', () => {
      const inventories: InventoryRecord[] = [
        {
          _id: new Types.ObjectId(),
          product: new Types.ObjectId(),
          quantity: -30,
          type: 'ship',
          lastUpdated: new Date('2024-01-02'),
          shippingOrderNumber: 'SH001',
          shippingOrderId: new Types.ObjectId()
        }
      ];

      const result = prepareInventoryForFIFO(inventories);

      expect(result.stockOut).toHaveLength(1);
      expect(result.stockOut[0].quantity).toBe(30);
      expect(result.stockOut[0].orderType).toBe('shipping');
      expect(result.stockOut[0].type).toBe('ship');
    });

    it('應該跳過不扣庫存的銷售記錄', () => {
      const inventories: InventoryRecord[] = [
        {
          _id: new Types.ObjectId(),
          product: new Types.ObjectId(),
          quantity: -50,
          type: 'sale-no-stock',
          lastUpdated: new Date('2024-01-02'),
          costPrice: 10,
          unitPrice: 15,
          grossProfit: 250
        }
      ];

      const result = prepareInventoryForFIFO(inventories);

      expect(result.stockIn).toHaveLength(0);
      expect(result.stockOut).toHaveLength(0);
    });

    it('應該正確排序記錄', () => {
      const inventories: InventoryRecord[] = [
        {
          _id: new Types.ObjectId(),
          product: new Types.ObjectId(),
          quantity: 50,
          type: 'purchase',
          lastUpdated: new Date('2024-01-02'),
          purchaseOrderNumber: 'PO002'
        },
        {
          _id: new Types.ObjectId(),
          product: new Types.ObjectId(),
          quantity: 100,
          type: 'purchase',
          lastUpdated: new Date('2024-01-01'),
          purchaseOrderNumber: 'PO001'
        }
      ];

      const result = prepareInventoryForFIFO(inventories);

      expect(result.stockIn).toHaveLength(2);
      expect(result.stockIn[0].orderNumber).toBe('PO001');
      expect(result.stockIn[1].orderNumber).toBe('PO002');
    });
  });

  describe('calculateProductFIFO', () => {
    it('應該計算完整的FIFO結果', () => {
      const inventories: InventoryRecord[] = [
        {
          _id: new Types.ObjectId(),
          product: new Types.ObjectId(),
          quantity: 100,
          totalAmount: 1000,
          type: 'purchase',
          lastUpdated: new Date('2024-01-01'),
          purchaseOrderNumber: 'PO001'
        },
        {
          _id: new Types.ObjectId(),
          product: new Types.ObjectId(),
          quantity: -50,
          totalAmount: 750,
          type: 'sale',
          lastUpdated: new Date('2024-01-02'),
          saleNumber: 'SO001'
        }
      ];

      const result = calculateProductFIFO(inventories);

      expect(result.success).toBe(true);
      expect(result.fifoMatches).toHaveLength(1);
      expect(result.profitMargins).toHaveLength(1);
      expect(result.summary).toBeDefined();
      
      expect(result.profitMargins![0].totalCost).toBe(500); // 50 * 10
      expect(result.profitMargins![0].totalRevenue).toBe(750);
      expect(result.profitMargins![0].grossProfit).toBe(250);
    });

    it('應該處理沒有出貨記錄的情況', () => {
      const inventories: InventoryRecord[] = [
        {
          _id: new Types.ObjectId(),
          product: new Types.ObjectId(),
          quantity: 100,
          totalAmount: 1000,
          type: 'purchase',
          lastUpdated: new Date('2024-01-01'),
          purchaseOrderNumber: 'PO001'
        }
      ];

      const result = calculateProductFIFO(inventories);

      expect(result.success).toBe(true);
      expect(result.fifoMatches).toHaveLength(0);
      expect(result.profitMargins).toHaveLength(0);
      expect(result.summary?.totalCost).toBe(0);
      expect(result.summary?.totalRevenue).toBe(0);
    });

    it('應該處理不扣庫存的銷售', () => {
      const inventories: InventoryRecord[] = [
        {
          _id: new Types.ObjectId(),
          product: new Types.ObjectId(),
          quantity: -50,
          totalAmount: 750,
          type: 'sale-no-stock',
          lastUpdated: new Date('2024-01-02'),
          costPrice: 10,
          unitPrice: 15,
          grossProfit: 250,
          saleNumber: 'SO001'
        }
      ];

      const result = calculateProductFIFO(inventories);

      expect(result.success).toBe(true);
      // 不扣庫存的銷售不會產生stockOut記錄，所以沒有FIFO匹配
      expect(result.fifoMatches).toHaveLength(0);
      // 但應該有不扣庫存的毛利記錄
      expect(result.profitMargins).toHaveLength(1);
      expect(result.profitMargins![0].isNoStockSale).toBe(true);
      expect(result.profitMargins![0].grossProfit).toBe(250);
    });

    it('應該處理錯誤情況', () => {
      // 模擬錯誤情況
      const invalidInventories = null as any;

      const result = calculateProductFIFO(invalidInventories);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('應該計算正確的總結', () => {
      const inventories: InventoryRecord[] = [
        {
          _id: new Types.ObjectId(),
          product: new Types.ObjectId(),
          quantity: 100,
          totalAmount: 1000,
          type: 'purchase',
          lastUpdated: new Date('2024-01-01'),
          purchaseOrderNumber: 'PO001'
        },
        {
          _id: new Types.ObjectId(),
          product: new Types.ObjectId(),
          quantity: -30,
          totalAmount: 450,
          type: 'sale',
          lastUpdated: new Date('2024-01-02'),
          saleNumber: 'SO001'
        },
        {
          _id: new Types.ObjectId(),
          product: new Types.ObjectId(),
          quantity: -20,
          totalAmount: 320,
          type: 'sale',
          lastUpdated: new Date('2024-01-03'),
          saleNumber: 'SO002'
        }
      ];

      const result = calculateProductFIFO(inventories);

      expect(result.success).toBe(true);
      expect(result.summary?.totalCost).toBe(500); // (30 + 20) * 10
      expect(result.summary?.totalRevenue).toBe(770); // 450 + 320
      expect(result.summary?.totalProfit).toBe(270); // 770 - 500
    });
  });

  describe('edge cases', () => {
    it('應該處理零數量的記錄', () => {
      const stockIn: StockInRecord[] = [
        {
          timestamp: new Date('2024-01-01'),
          quantity: 0,
          unit_price: 10,
          drug_id: 'drug1',
          source_id: 'source1',
          orderNumber: 'PO001',
          orderId: 'order1',
          orderType: 'purchase'
        }
      ];

      const stockOut: StockOutRecord[] = [
        {
          timestamp: new Date('2024-01-02'),
          quantity: 0,
          drug_id: 'drug1',
          source_id: 'source2',
          type: 'sale',
          orderNumber: 'SO001',
          orderId: 'sale1',
          orderType: 'sale'
        }
      ];

      const result = matchFIFOBatches(stockIn, stockOut);

      expect(result).toHaveLength(1);
      expect(result[0].totalQuantity).toBe(0);
      expect(result[0].costParts).toHaveLength(0);
    });

    it('應該處理極大數量的記錄', () => {
      const stockIn: StockInRecord[] = [
        {
          timestamp: new Date('2024-01-01'),
          quantity: 1000000,
          unit_price: 0.01,
          drug_id: 'drug1',
          source_id: 'source1',
          orderNumber: 'PO001',
          orderId: 'order1',
          orderType: 'purchase'
        }
      ];

      const stockOut: StockOutRecord[] = [
        {
          timestamp: new Date('2024-01-02'),
          quantity: 999999,
          drug_id: 'drug1',
          source_id: 'source2',
          type: 'sale',
          orderNumber: 'SO001',
          orderId: 'sale1',
          orderType: 'sale'
        }
      ];

      const result = matchFIFOBatches(stockIn, stockOut);

      expect(result).toHaveLength(1);
      expect(result[0].totalQuantity).toBe(999999);
      expect(result[0].costParts[0].quantity).toBe(999999);
    });
  });
});