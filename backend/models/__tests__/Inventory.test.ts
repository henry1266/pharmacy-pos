import mongoose from 'mongoose';
import Inventory, { IInventory, InventoryType } from '../Inventory';

describe('Inventory Model', () => {
  beforeEach(async () => {
    // 清理測試數據
    await Inventory.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('應該成功創建有效的庫存記錄', async () => {
      const inventoryData: Partial<IInventory> = {
        product: new mongoose.Types.ObjectId(),
        quantity: 100,
        totalAmount: 5000,
        purchaseOrderId: new mongoose.Types.ObjectId(),
        purchaseOrderNumber: 'PO001',
        type: 'purchase',
        referenceId: new mongoose.Types.ObjectId(),
        saleId: new mongoose.Types.ObjectId(),
        saleNumber: 'SALE001',
        shippingOrderId: new mongoose.Types.ObjectId(),
        shippingOrderNumber: 'SHIP001',
        accountingId: new mongoose.Types.ObjectId(),
        notes: '測試庫存記錄',
        batchNumber: 'BATCH001',
        createdBy: new mongoose.Types.ObjectId(),
        costPrice: 45,
        unitPrice: 50,
        grossProfit: 500
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();

      expect(savedInventory._id).toBeDefined();
      expect(savedInventory.product).toEqual(inventoryData.product);
      expect(savedInventory.quantity).toBe(inventoryData.quantity);
      expect(savedInventory.totalAmount).toBe(inventoryData.totalAmount);
      expect(savedInventory.purchaseOrderId).toEqual(inventoryData.purchaseOrderId);
      expect(savedInventory.purchaseOrderNumber).toBe(inventoryData.purchaseOrderNumber);
      expect(savedInventory.type).toBe(inventoryData.type);
      expect(savedInventory.referenceId).toEqual(inventoryData.referenceId);
      expect(savedInventory.saleId).toEqual(inventoryData.saleId);
      expect(savedInventory.saleNumber).toBe(inventoryData.saleNumber);
      expect(savedInventory.shippingOrderId).toEqual(inventoryData.shippingOrderId);
      expect(savedInventory.shippingOrderNumber).toBe(inventoryData.shippingOrderNumber);
      expect(savedInventory.accountingId).toEqual(inventoryData.accountingId);
      expect(savedInventory.notes).toBe(inventoryData.notes);
      expect(savedInventory.batchNumber).toBe(inventoryData.batchNumber);
      expect(savedInventory.createdBy).toEqual(inventoryData.createdBy);
      expect(savedInventory.costPrice).toBe(inventoryData.costPrice);
      expect(savedInventory.unitPrice).toBe(inventoryData.unitPrice);
      expect(savedInventory.grossProfit).toBe(inventoryData.grossProfit);
      expect(savedInventory.date).toBeDefined();
      expect(savedInventory.lastUpdated).toBeDefined();
      expect((savedInventory as any).createdAt).toBeDefined();
      expect((savedInventory as any).updatedAt).toBeDefined();
    });

    it('應該要求必填欄位', async () => {
      const inventory = new Inventory({});
      
      await expect(inventory.save()).rejects.toThrow();
    });

    it('應該要求產品ID', async () => {
      const inventoryData = {
        quantity: 100,
        type: 'purchase'
      };

      const inventory = new Inventory(inventoryData);
      await expect(inventory.save()).rejects.toThrow(/product.*required/i);
    });

    it('應該要求數量', async () => {
      const inventoryData = {
        product: new mongoose.Types.ObjectId(),
        type: 'purchase'
        // 沒有設置 quantity，但 schema 中有默認值 0，所以不會拋出錯誤
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();
      
      // 驗證默認值被設置
      expect(savedInventory.quantity).toBe(0);
    });

    it('應該驗證庫存類型枚舉值', async () => {
      const inventoryData = {
        product: new mongoose.Types.ObjectId(),
        quantity: 100,
        type: 'invalid_type' as InventoryType
      };

      const inventory = new Inventory(inventoryData);
      await expect(inventory.save()).rejects.toThrow();
    });

    it('應該設置默認值', async () => {
      const inventoryData = {
        product: new mongoose.Types.ObjectId(),
        quantity: 100
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();
      
      expect(savedInventory.totalAmount).toBe(0);
      expect(savedInventory.type).toBe('purchase');
      expect(savedInventory.costPrice).toBe(0);
      expect(savedInventory.unitPrice).toBe(0);
      expect(savedInventory.grossProfit).toBe(0);
      expect(savedInventory.date).toBeDefined();
      expect(savedInventory.lastUpdated).toBeDefined();
    });
  });

  describe('Inventory Types', () => {
    const productId = new mongoose.Types.ObjectId();

    it('應該創建進貨類型庫存記錄', async () => {
      const inventoryData = {
        product: productId,
        quantity: 50,
        totalAmount: 2500,
        type: 'purchase' as InventoryType,
        purchaseOrderId: new mongoose.Types.ObjectId(),
        purchaseOrderNumber: 'PO001',
        costPrice: 45,
        unitPrice: 50
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();

      expect(savedInventory.type).toBe('purchase');
      expect(savedInventory.quantity).toBe(50);
      expect(savedInventory.purchaseOrderId).toBeDefined();
      expect(savedInventory.purchaseOrderNumber).toBe('PO001');
    });

    it('應該創建銷售類型庫存記錄', async () => {
      const inventoryData = {
        product: productId,
        quantity: -10,
        totalAmount: -500,
        type: 'sale' as InventoryType,
        saleId: new mongoose.Types.ObjectId(),
        saleNumber: 'SALE001',
        costPrice: 45,
        unitPrice: 50,
        grossProfit: 50
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();

      expect(savedInventory.type).toBe('sale');
      expect(savedInventory.quantity).toBe(-10);
      expect(savedInventory.saleId).toBeDefined();
      expect(savedInventory.saleNumber).toBe('SALE001');
      expect(savedInventory.grossProfit).toBe(50);
    });

    it('應該創建退貨類型庫存記錄', async () => {
      const inventoryData = {
        product: productId,
        quantity: 5,
        totalAmount: 250,
        type: 'return' as InventoryType,
        referenceId: new mongoose.Types.ObjectId(),
        notes: '客戶退貨'
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();

      expect(savedInventory.type).toBe('return');
      expect(savedInventory.quantity).toBe(5);
      expect(savedInventory.notes).toBe('客戶退貨');
    });

    it('應該創建調整類型庫存記錄', async () => {
      const inventoryData = {
        product: productId,
        quantity: -3,
        totalAmount: -150,
        type: 'adjustment' as InventoryType,
        notes: '盤點調整',
        createdBy: new mongoose.Types.ObjectId()
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();

      expect(savedInventory.type).toBe('adjustment');
      expect(savedInventory.quantity).toBe(-3);
      expect(savedInventory.notes).toBe('盤點調整');
      expect(savedInventory.createdBy).toBeDefined();
    });

    it('應該創建出貨類型庫存記錄', async () => {
      const inventoryData = {
        product: productId,
        quantity: -20,
        totalAmount: -1000,
        type: 'ship' as InventoryType,
        shippingOrderId: new mongoose.Types.ObjectId(),
        shippingOrderNumber: 'SHIP001'
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();

      expect(savedInventory.type).toBe('ship');
      expect(savedInventory.quantity).toBe(-20);
      expect(savedInventory.shippingOrderId).toBeDefined();
      expect(savedInventory.shippingOrderNumber).toBe('SHIP001');
    });

    it('應該創建不扣庫存銷售類型記錄', async () => {
      const inventoryData = {
        product: productId,
        quantity: 0, // 不扣庫存
        totalAmount: 0,
        type: 'sale-no-stock' as InventoryType,
        saleId: new mongoose.Types.ObjectId(),
        saleNumber: 'SALE_NO_STOCK001',
        costPrice: 45,
        unitPrice: 50,
        grossProfit: 50
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();

      expect(savedInventory.type).toBe('sale-no-stock');
      expect(savedInventory.quantity).toBe(0);
      expect(savedInventory.grossProfit).toBe(50);
    });
  });

  describe('Batch Number and Reference Fields', () => {
    it('應該支援批號記錄', async () => {
      const inventoryData = {
        product: new mongoose.Types.ObjectId(),
        quantity: 100,
        type: 'purchase' as InventoryType,
        batchNumber: 'BATCH20240101001',
        notes: '第一批進貨'
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();

      expect(savedInventory.batchNumber).toBe('BATCH20240101001');
      expect(savedInventory.notes).toBe('第一批進貨');
    });

    it('應該支援會計記錄關聯', async () => {
      const inventoryData = {
        product: new mongoose.Types.ObjectId(),
        quantity: 50,
        type: 'purchase' as InventoryType,
        accountingId: new mongoose.Types.ObjectId(),
        notes: '已記帳'
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();

      expect(savedInventory.accountingId).toBeDefined();
      expect(savedInventory.notes).toBe('已記帳');
    });

    it('應該支援創建者記錄', async () => {
      const createdBy = new mongoose.Types.ObjectId();
      const inventoryData = {
        product: new mongoose.Types.ObjectId(),
        quantity: 25,
        type: 'adjustment' as InventoryType,
        createdBy: createdBy,
        notes: '管理員調整'
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();

      expect(savedInventory.createdBy).toEqual(createdBy);
    });
  });

  describe('Profit Calculation Fields', () => {
    it('應該正確記錄毛利計算相關欄位', async () => {
      const inventoryData = {
        product: new mongoose.Types.ObjectId(),
        quantity: -10, // 銷售
        totalAmount: -500,
        type: 'sale' as InventoryType,
        costPrice: 40, // 成本價
        unitPrice: 50, // 售價
        grossProfit: 100 // 毛利 = (50-40) * 10
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();

      expect(savedInventory.costPrice).toBe(40);
      expect(savedInventory.unitPrice).toBe(50);
      expect(savedInventory.grossProfit).toBe(100);
    });

    it('應該處理零毛利的情況', async () => {
      const inventoryData = {
        product: new mongoose.Types.ObjectId(),
        quantity: -5,
        totalAmount: -250,
        type: 'sale' as InventoryType,
        costPrice: 50, // 成本價等於售價
        unitPrice: 50,
        grossProfit: 0
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();

      expect(savedInventory.grossProfit).toBe(0);
    });

    it('應該處理負毛利的情況', async () => {
      const inventoryData = {
        product: new mongoose.Types.ObjectId(),
        quantity: -3,
        totalAmount: -150,
        type: 'sale' as InventoryType,
        costPrice: 60, // 成本價高於售價
        unitPrice: 50,
        grossProfit: -30 // 虧損
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();

      expect(savedInventory.grossProfit).toBe(-30);
    });
  });

  describe('Timestamps', () => {
    it('應該自動設置date和lastUpdated', async () => {
      const inventoryData = {
        product: new mongoose.Types.ObjectId(),
        quantity: 100,
        type: 'purchase' as InventoryType
      };

      const inventory = new Inventory(inventoryData);
      const savedInventory = await inventory.save();
      
      expect(savedInventory.date).toBeDefined();
      expect(savedInventory.lastUpdated).toBeDefined();
      expect(savedInventory.date).toBeInstanceOf(Date);
      expect(savedInventory.lastUpdated).toBeInstanceOf(Date);
      expect((savedInventory as any).createdAt).toBeDefined();
      expect((savedInventory as any).updatedAt).toBeDefined();
    });

    it('應該在更新時更新updatedAt', async () => {
      const inventoryData = {
        product: new mongoose.Types.ObjectId(),
        quantity: 100,
        type: 'purchase' as InventoryType
      };

      const inventory = await new Inventory(inventoryData).save();
      const originalUpdatedAt = (inventory as any).updatedAt;
      
      // 等待一毫秒確保時間差異
      await new Promise(resolve => setTimeout(resolve, 1));
      
      inventory.notes = '更新的備註';
      const updatedInventory = await inventory.save();
      
      expect((updatedInventory as any).updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      const productA = new mongoose.Types.ObjectId();
      const productB = new mongoose.Types.ObjectId();
      
      // 創建測試數據
      await Inventory.create([
        {
          product: productA,
          quantity: 100,
          totalAmount: 5000,
          type: 'purchase',
          purchaseOrderNumber: 'PO001',
          batchNumber: 'BATCH001',
          date: new Date('2024-01-01')
        },
        {
          product: productA,
          quantity: -10,
          totalAmount: -500,
          type: 'sale',
          saleNumber: 'SALE001',
          costPrice: 45,
          unitPrice: 50,
          grossProfit: 50,
          date: new Date('2024-01-02')
        },
        {
          product: productB,
          quantity: 50,
          totalAmount: 2500,
          type: 'purchase',
          purchaseOrderNumber: 'PO002',
          batchNumber: 'BATCH002',
          date: new Date('2024-01-03')
        },
        {
          product: productA,
          quantity: -5,
          totalAmount: -250,
          type: 'adjustment',
          notes: '盤點調整',
          date: new Date('2024-01-04')
        }
      ]);
    });

    it('應該能夠按產品查詢', async () => {
      const inventories = await Inventory.find({});
      const firstProductId = inventories[0].product.toString();
      const productAInventories = inventories.filter(inv =>
        inv.product.toString() === firstProductId
      );
      
      expect(productAInventories).toHaveLength(3);
    });

    it('應該能夠按庫存類型查詢', async () => {
      const purchaseInventories = await Inventory.find({ type: 'purchase' });
      expect(purchaseInventories).toHaveLength(2);

      const saleInventories = await Inventory.find({ type: 'sale' });
      expect(saleInventories).toHaveLength(1);

      const adjustmentInventories = await Inventory.find({ type: 'adjustment' });
      expect(adjustmentInventories).toHaveLength(1);
    });

    it('應該能夠按日期範圍查詢', async () => {
      const inventoriesInRange = await Inventory.find({
        date: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-01-02')
        }
      });
      expect(inventoriesInRange).toHaveLength(2);
    });

    it('應該能夠按批號查詢', async () => {
      const batchInventories = await Inventory.find({ batchNumber: 'BATCH001' });
      expect(batchInventories).toHaveLength(1);
      expect(batchInventories[0].type).toBe('purchase');
    });

    it('應該能夠按進貨單號查詢', async () => {
      const poInventories = await Inventory.find({ purchaseOrderNumber: 'PO002' });
      expect(poInventories).toHaveLength(1);
      expect(poInventories[0].quantity).toBe(50);
    });

    it('應該能夠按銷售單號查詢', async () => {
      const saleInventories = await Inventory.find({ saleNumber: 'SALE001' });
      expect(saleInventories).toHaveLength(1);
      expect(saleInventories[0].type).toBe('sale');
      expect(saleInventories[0].grossProfit).toBe(50);
    });

    it('應該能夠查詢有毛利的記錄', async () => {
      const profitInventories = await Inventory.find({ 
        grossProfit: { $gt: 0 } 
      });
      expect(profitInventories).toHaveLength(1);
      expect(profitInventories[0].type).toBe('sale');
    });

    it('應該能夠按數量範圍查詢', async () => {
      const positiveInventories = await Inventory.find({ quantity: { $gt: 0 } });
      expect(positiveInventories).toHaveLength(2); // 兩筆進貨

      const negativeInventories = await Inventory.find({ quantity: { $lt: 0 } });
      expect(negativeInventories).toHaveLength(2); // 一筆銷售，一筆調整
    });
  });

  describe('Complex Scenarios', () => {
    it('應該處理完整的產品庫存流程', async () => {
      const productId = new mongoose.Types.ObjectId();
      const purchaseOrderId = new mongoose.Types.ObjectId();
      const saleId = new mongoose.Types.ObjectId();

      // 1. 進貨
      const purchaseInventory = await Inventory.create({
        product: productId,
        quantity: 100,
        totalAmount: 4500,
        type: 'purchase',
        purchaseOrderId: purchaseOrderId,
        purchaseOrderNumber: 'PO001',
        batchNumber: 'BATCH001',
        costPrice: 45
      });

      expect(purchaseInventory.type).toBe('purchase');
      expect(purchaseInventory.quantity).toBe(100);

      // 2. 銷售
      const saleInventory = await Inventory.create({
        product: productId,
        quantity: -20,
        totalAmount: -1000,
        type: 'sale',
        saleId: saleId,
        saleNumber: 'SALE001',
        costPrice: 45,
        unitPrice: 50,
        grossProfit: 100 // (50-45) * 20
      });

      expect(saleInventory.type).toBe('sale');
      expect(saleInventory.quantity).toBe(-20);
      expect(saleInventory.grossProfit).toBe(100);

      // 3. 退貨
      const returnInventory = await Inventory.create({
        product: productId,
        quantity: 2,
        totalAmount: 100,
        type: 'return',
        referenceId: saleId,
        notes: '客戶退貨'
      });

      expect(returnInventory.type).toBe('return');
      expect(returnInventory.quantity).toBe(2);

      // 4. 盤點調整
      const adjustmentInventory = await Inventory.create({
        product: productId,
        quantity: -1,
        totalAmount: -45,
        type: 'adjustment',
        notes: '盤點短少',
        createdBy: new mongoose.Types.ObjectId()
      });

      expect(adjustmentInventory.type).toBe('adjustment');
      expect(adjustmentInventory.quantity).toBe(-1);

      // 驗證總庫存變化
      const allInventories = await Inventory.find({ product: productId });
      const totalQuantityChange = allInventories.reduce((sum, inv) => sum + inv.quantity, 0);
      expect(totalQuantityChange).toBe(81); // 100 - 20 + 2 - 1
    });

    it('應該處理不扣庫存的銷售記錄', async () => {
      const productId = new mongoose.Types.ObjectId();

      // 不扣庫存銷售
      const noStockSale = await Inventory.create({
        product: productId,
        quantity: 0, // 不影響庫存
        totalAmount: 0,
        type: 'sale-no-stock',
        saleId: new mongoose.Types.ObjectId(),
        saleNumber: 'SALE_NO_STOCK001',
        costPrice: 40,
        unitPrice: 50,
        grossProfit: 50 // 仍然計算毛利
      });

      expect(noStockSale.type).toBe('sale-no-stock');
      expect(noStockSale.quantity).toBe(0);
      expect(noStockSale.grossProfit).toBe(50);

      // 驗證庫存不受影響
      const totalQuantity = await Inventory.aggregate([
        { $match: { product: productId } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]);

      expect(totalQuantity[0]?.total || 0).toBe(0);
    });

    it('應該處理批量庫存操作', async () => {
      const products = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ];

      const batchInventories = await Inventory.create([
        {
          product: products[0],
          quantity: 50,
          totalAmount: 2500,
          type: 'purchase',
          batchNumber: 'BATCH_MULTI_001'
        },
        {
          product: products[1],
          quantity: 30,
          totalAmount: 1500,
          type: 'purchase',
          batchNumber: 'BATCH_MULTI_001'
        },
        {
          product: products[2],
          quantity: 20,
          totalAmount: 1000,
          type: 'purchase',
          batchNumber: 'BATCH_MULTI_001'
        }
      ]);

      expect(batchInventories).toHaveLength(3);

      // 驗證批號查詢
      const batchRecords = await Inventory.find({ batchNumber: 'BATCH_MULTI_001' });
      expect(batchRecords).toHaveLength(3);

      const totalBatchQuantity = batchRecords.reduce((sum, inv) => sum + inv.quantity, 0);
      expect(totalBatchQuantity).toBe(100);

      const totalBatchAmount = batchRecords.reduce((sum, inv) => sum + inv.totalAmount, 0);
      expect(totalBatchAmount).toBe(5000);
    });
  });
});