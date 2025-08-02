import mongoose from 'mongoose';
import PurchaseOrder, { IPurchaseOrder } from '../PurchaseOrder';

describe('PurchaseOrder Model', () => {
  beforeEach(async () => {
    // 清理測試數據
    await PurchaseOrder.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('應該成功創建有效的進貨單', async () => {
      const purchaseOrderData: Partial<IPurchaseOrder> = {
        poid: 'PO001',
        orderNumber: 'ORDER001',
        pobill: 'BILL001',
        pobilldate: new Date('2024-01-01'),
        posupplier: '測試供應商',
        supplier: new mongoose.Types.ObjectId(),
        organizationId: new mongoose.Types.ObjectId(),
        transactionType: '進貨',
        accountingEntryType: 'expense-asset',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            did: 'ITEM001',
            dname: '測試商品1',
            dquantity: 10,
            dtotalCost: 1000,
            unitPrice: 100,
            batchNumber: 'BATCH001',
            packageQuantity: 2,
            boxQuantity: 5
          },
          {
            product: new mongoose.Types.ObjectId(),
            did: 'ITEM002',
            dname: '測試商品2',
            dquantity: 5,
            dtotalCost: 500,
            unitPrice: 100,
            batchNumber: 'BATCH002'
          }
        ],
        status: 'pending',
        paymentStatus: '未付',
        notes: '測試進貨單'
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      const savedPurchaseOrder = await purchaseOrder.save();

      expect(savedPurchaseOrder._id).toBeDefined();
      expect(savedPurchaseOrder.poid).toBe(purchaseOrderData.poid);
      expect(savedPurchaseOrder.orderNumber).toBe(purchaseOrderData.orderNumber);
      expect(savedPurchaseOrder.pobill).toBe(purchaseOrderData.pobill);
      expect(savedPurchaseOrder.pobilldate).toEqual(purchaseOrderData.pobilldate);
      expect(savedPurchaseOrder.posupplier).toBe(purchaseOrderData.posupplier);
      expect(savedPurchaseOrder.supplier).toEqual(purchaseOrderData.supplier);
      expect(savedPurchaseOrder.organizationId).toEqual(purchaseOrderData.organizationId);
      expect(savedPurchaseOrder.transactionType).toBe(purchaseOrderData.transactionType);
      expect(savedPurchaseOrder.accountingEntryType).toBe(purchaseOrderData.accountingEntryType);
      expect(savedPurchaseOrder.items).toHaveLength(2);
      expect(savedPurchaseOrder.items[0].did).toBe('ITEM001');
      expect(savedPurchaseOrder.items[0].dname).toBe('測試商品1');
      expect(savedPurchaseOrder.items[0].dquantity).toBe(10);
      expect(savedPurchaseOrder.items[0].dtotalCost).toBe(1000);
      expect(savedPurchaseOrder.items[0].packageQuantity).toBe(2);
      expect(savedPurchaseOrder.items[0].boxQuantity).toBe(5);
      expect(savedPurchaseOrder.totalAmount).toBe(1500); // 自動計算
      expect(savedPurchaseOrder.status).toBe(purchaseOrderData.status);
      expect(savedPurchaseOrder.paymentStatus).toBe(purchaseOrderData.paymentStatus);
      expect(savedPurchaseOrder.notes).toBe(purchaseOrderData.notes);
      expect(savedPurchaseOrder.createdAt).toBeDefined();
      expect(savedPurchaseOrder.updatedAt).toBeDefined();
    });

    it('應該要求必填欄位', async () => {
      const purchaseOrder = new PurchaseOrder({});
      
      await expect(purchaseOrder.save()).rejects.toThrow();
    });

    it('應該要求進貨單ID', async () => {
      const purchaseOrderData = {
        posupplier: '測試供應商',
        items: []
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      await expect(purchaseOrder.save()).rejects.toThrow(/poid.*required/i);
    });

    it('應該要求供應商名稱', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        items: []
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      await expect(purchaseOrder.save()).rejects.toThrow(/posupplier.*required/i);
    });

    it('應該確保進貨單ID唯一性', async () => {
      const purchaseOrderData1 = {
        poid: 'PO001',
        posupplier: '供應商1',
        items: []
      };

      const purchaseOrderData2 = {
        poid: 'PO001', // 相同ID
        posupplier: '供應商2',
        items: []
      };

      await new PurchaseOrder(purchaseOrderData1).save();
      
      const purchaseOrder2 = new PurchaseOrder(purchaseOrderData2);
      await expect(purchaseOrder2.save()).rejects.toThrow(/duplicate key/i);
    });

    it('應該確保訂單編號唯一性', async () => {
      const purchaseOrderData1 = {
        poid: 'PO001',
        orderNumber: 'ORDER001',
        posupplier: '供應商1',
        items: []
      };

      const purchaseOrderData2 = {
        poid: 'PO002',
        orderNumber: 'ORDER001', // 相同訂單編號
        posupplier: '供應商2',
        items: []
      };

      await new PurchaseOrder(purchaseOrderData1).save();
      
      const purchaseOrder2 = new PurchaseOrder(purchaseOrderData2);
      await expect(purchaseOrder2.save()).rejects.toThrow(/duplicate key/i);
    });

    it('應該驗證狀態枚舉值', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: [],
        status: 'invalid_status' as any
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      await expect(purchaseOrder.save()).rejects.toThrow();
    });

    it('應該驗證付款狀態枚舉值', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: [],
        paymentStatus: 'invalid_payment_status' as any
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      await expect(purchaseOrder.save()).rejects.toThrow();
    });

    it('應該驗證交易類型枚舉值', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: [],
        transactionType: 'invalid_transaction_type' as any
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      await expect(purchaseOrder.save()).rejects.toThrow();
    });

    it('應該驗證會計分錄類型枚舉值', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: [],
        accountingEntryType: 'invalid_accounting_type' as any
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      await expect(purchaseOrder.save()).rejects.toThrow();
    });

    it('應該設置默認值', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: []
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      const savedPurchaseOrder = await purchaseOrder.save();
      
      expect(savedPurchaseOrder.totalAmount).toBe(0);
      expect(savedPurchaseOrder.status).toBe('pending');
      expect(savedPurchaseOrder.paymentStatus).toBe('未付');
      expect(savedPurchaseOrder.orderNumber).toBe(savedPurchaseOrder.poid); // 默認使用poid
      expect(savedPurchaseOrder.createdAt).toBeDefined();
      expect(savedPurchaseOrder.updatedAt).toBeDefined();
    });
  });

  describe('Purchase Order Items', () => {
    it('應該要求商品項目的必填欄位', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: [
          {
            // 缺少 product
            did: 'ITEM001',
            dname: '測試商品',
            dquantity: 10,
            dtotalCost: 1000
          }
        ]
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      await expect(purchaseOrder.save()).rejects.toThrow(/product.*required/i);
    });

    it('應該要求商品項目ID', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            // 缺少 did
            dname: '測試商品',
            dquantity: 10,
            dtotalCost: 1000
          }
        ]
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      await expect(purchaseOrder.save()).rejects.toThrow(/did.*required/i);
    });

    it('應該要求商品項目名稱', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            did: 'ITEM001',
            // 缺少 dname
            dquantity: 10,
            dtotalCost: 1000
          }
        ]
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      await expect(purchaseOrder.save()).rejects.toThrow(/dname.*required/i);
    });

    it('應該要求商品項目數量', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            did: 'ITEM001',
            dname: '測試商品',
            // 缺少 dquantity
            dtotalCost: 1000
          }
        ]
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      await expect(purchaseOrder.save()).rejects.toThrow(/dquantity.*required/i);
    });

    it('應該要求商品項目總成本', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            did: 'ITEM001',
            dname: '測試商品',
            dquantity: 10
            // 缺少 dtotalCost
          }
        ]
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      await expect(purchaseOrder.save()).rejects.toThrow(/dtotalCost.*required/i);
    });

    it('應該自動計算單價', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            did: 'ITEM001',
            dname: '測試商品',
            dquantity: 10,
            dtotalCost: 1000
            // unitPrice 應該自動計算為 100
          }
        ]
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      const savedPurchaseOrder = await purchaseOrder.save();
      
      expect(savedPurchaseOrder.items[0].unitPrice).toBe(100);
    });

    it('應該處理數量為0的情況', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            did: 'ITEM001',
            dname: '測試商品',
            dquantity: 0,
            dtotalCost: 1000
          }
        ]
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      const savedPurchaseOrder = await purchaseOrder.save();
      
      expect(savedPurchaseOrder.items[0].unitPrice).toBe(0);
    });
  });

  describe('Pre-save Middleware', () => {
    it('應該自動計算總金額', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            did: 'ITEM001',
            dname: '測試商品1',
            dquantity: 10,
            dtotalCost: 1000
          },
          {
            product: new mongoose.Types.ObjectId(),
            did: 'ITEM002',
            dname: '測試商品2',
            dquantity: 5,
            dtotalCost: 500
          }
        ]
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      const savedPurchaseOrder = await purchaseOrder.save();
      
      expect(savedPurchaseOrder.totalAmount).toBe(1500); // 1000 + 500
    });

    it('應該自動更新updatedAt', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: []
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      const savedPurchaseOrder = await purchaseOrder.save();
      const originalUpdatedAt = savedPurchaseOrder.updatedAt;
      
      // 等待一毫秒確保時間差異
      await new Promise(resolve => setTimeout(resolve, 1));
      
      savedPurchaseOrder.notes = '更新的備註';
      const updatedPurchaseOrder = await savedPurchaseOrder.save();
      
      expect(updatedPurchaseOrder.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('應該確保orderNumber有值', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: []
        // 沒有設置 orderNumber
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      const savedPurchaseOrder = await purchaseOrder.save();
      
      expect(savedPurchaseOrder.orderNumber).toBe('PO001'); // 應該使用poid
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      // 創建測試數據
      await PurchaseOrder.create([
        {
          poid: 'PO001',
          orderNumber: 'ORDER001',
          posupplier: '供應商A',
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              did: 'ITEM001',
              dname: '商品1',
              dquantity: 10,
              dtotalCost: 1000
            }
          ],
          status: 'pending',
          paymentStatus: '未付',
          transactionType: '進貨'
        },
        {
          poid: 'PO002',
          orderNumber: 'ORDER002',
          posupplier: '供應商B',
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              did: 'ITEM002',
              dname: '商品2',
              dquantity: 5,
              dtotalCost: 500
            }
          ],
          status: 'completed',
          paymentStatus: '已匯款',
          transactionType: '支出'
        },
        {
          poid: 'PO003',
          orderNumber: 'ORDER003',
          posupplier: '供應商A',
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              did: 'ITEM003',
              dname: '商品3',
              dquantity: 20,
              dtotalCost: 2000
            }
          ],
          status: 'cancelled',
          paymentStatus: '未付'
        }
      ]);
    });

    it('應該能夠按狀態查詢', async () => {
      const pendingOrders = await PurchaseOrder.find({ status: 'pending' });
      expect(pendingOrders).toHaveLength(1);
      expect(pendingOrders[0].poid).toBe('PO001');

      const completedOrders = await PurchaseOrder.find({ status: 'completed' });
      expect(completedOrders).toHaveLength(1);
      expect(completedOrders[0].poid).toBe('PO002');
    });

    it('應該能夠按付款狀態查詢', async () => {
      const unpaidOrders = await PurchaseOrder.find({ paymentStatus: '未付' });
      expect(unpaidOrders).toHaveLength(2);

      const paidOrders = await PurchaseOrder.find({ paymentStatus: '已匯款' });
      expect(paidOrders).toHaveLength(1);
      expect(paidOrders[0].poid).toBe('PO002');
    });

    it('應該能夠按供應商查詢', async () => {
      const supplierAOrders = await PurchaseOrder.find({ posupplier: '供應商A' });
      expect(supplierAOrders).toHaveLength(2);

      const supplierBOrders = await PurchaseOrder.find({ posupplier: '供應商B' });
      expect(supplierBOrders).toHaveLength(1);
    });

    it('應該能夠按進貨單ID查詢', async () => {
      const order = await PurchaseOrder.findOne({ poid: 'PO002' });
      expect(order).toBeTruthy();
      expect(order?.posupplier).toBe('供應商B');
    });

    it('應該能夠按訂單編號查詢', async () => {
      const order = await PurchaseOrder.findOne({ orderNumber: 'ORDER003' });
      expect(order).toBeTruthy();
      expect(order?.poid).toBe('PO003');
    });

    it('應該能夠按金額範圍查詢', async () => {
      const highValueOrders = await PurchaseOrder.find({ 
        totalAmount: { $gte: 1000 } 
      });
      expect(highValueOrders).toHaveLength(2);
    });

    it('應該能夠按交易類型查詢', async () => {
      const purchaseOrders = await PurchaseOrder.find({ transactionType: '進貨' });
      expect(purchaseOrders).toHaveLength(1);
      expect(purchaseOrders[0].poid).toBe('PO001');

      const expenseOrders = await PurchaseOrder.find({ transactionType: '支出' });
      expect(expenseOrders).toHaveLength(1);
      expect(expenseOrders[0].poid).toBe('PO002');
    });
  });

  describe('Complex Scenarios', () => {
    it('應該處理完整的進貨單生命週期', async () => {
      // 創建新進貨單
      const purchaseOrder = await PurchaseOrder.create({
        poid: 'PO001',
        posupplier: '測試供應商',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            did: 'ITEM001',
            dname: '測試商品',
            dquantity: 10,
            dtotalCost: 1000
          }
        ],
        status: 'pending',
        paymentStatus: '未付'
      });

      expect(purchaseOrder.status).toBe('pending');
      expect(purchaseOrder.paymentStatus).toBe('未付');
      expect(purchaseOrder.totalAmount).toBe(1000);

      // 更新狀態為已完成
      purchaseOrder.status = 'completed';
      purchaseOrder.paymentStatus = '已下收';
      await purchaseOrder.save();

      expect(purchaseOrder.status).toBe('completed');
      expect(purchaseOrder.paymentStatus).toBe('已下收');

      // 最終付款
      purchaseOrder.paymentStatus = '已匯款';
      purchaseOrder.notes = '付款完成';
      await purchaseOrder.save();

      expect(purchaseOrder.paymentStatus).toBe('已匯款');
      expect(purchaseOrder.notes).toBe('付款完成');
    });

    it('應該處理多商品的複雜進貨單', async () => {
      const complexPurchaseOrder = await PurchaseOrder.create({
        poid: 'PO_COMPLEX',
        orderNumber: 'ORDER_COMPLEX',
        pobill: 'BILL_COMPLEX',
        pobilldate: new Date('2024-01-15'),
        posupplier: '複雜供應商',
        supplier: new mongoose.Types.ObjectId(),
        organizationId: new mongoose.Types.ObjectId(),
        transactionType: '進貨',
        accountingEntryType: 'expense-asset',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            did: 'ITEM001',
            dname: '商品A',
            dquantity: 10,
            dtotalCost: 1000,
            batchNumber: 'BATCH001',
            packageQuantity: 2,
            boxQuantity: 5
          },
          {
            product: new mongoose.Types.ObjectId(),
            did: 'ITEM002',
            dname: '商品B',
            dquantity: 20,
            dtotalCost: 1500,
            batchNumber: 'BATCH002',
            packageQuantity: 4,
            boxQuantity: 5
          },
          {
            product: new mongoose.Types.ObjectId(),
            did: 'ITEM003',
            dname: '商品C',
            dquantity: 5,
            dtotalCost: 750,
            batchNumber: 'BATCH003'
          }
        ],
        status: 'completed',
        paymentStatus: '已匯款',
        notes: '複雜進貨單測試'
      });

      expect(complexPurchaseOrder.items).toHaveLength(3);
      expect(complexPurchaseOrder.totalAmount).toBe(3250); // 1000 + 1500 + 750
      expect(complexPurchaseOrder.items[0].unitPrice).toBe(100); // 1000 / 10
      expect(complexPurchaseOrder.items[1].unitPrice).toBe(75); // 1500 / 20
      expect(complexPurchaseOrder.items[2].unitPrice).toBe(150); // 750 / 5
    });

    it('應該處理會計相關欄位', async () => {
      const accountingPurchaseOrder = await PurchaseOrder.create({
        poid: 'PO_ACCOUNTING',
        posupplier: '會計測試供應商',
        organizationId: new mongoose.Types.ObjectId(),
        transactionType: '進貨',
        selectedAccountIds: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId()
        ],
        accountingEntryType: 'asset-liability',
        relatedTransactionGroupId: new mongoose.Types.ObjectId(),
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            did: 'ITEM001',
            dname: '會計商品',
            dquantity: 1,
            dtotalCost: 100
          }
        ]
      });

      expect(accountingPurchaseOrder.organizationId).toBeDefined();
      expect(accountingPurchaseOrder.transactionType).toBe('進貨');
      expect(accountingPurchaseOrder.selectedAccountIds).toHaveLength(2);
      expect(accountingPurchaseOrder.accountingEntryType).toBe('asset-liability');
      expect(accountingPurchaseOrder.relatedTransactionGroupId).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    it('應該自動設置createdAt和updatedAt', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: []
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      const savedPurchaseOrder = await purchaseOrder.save();
      
      expect(savedPurchaseOrder.createdAt).toBeDefined();
      expect(savedPurchaseOrder.updatedAt).toBeDefined();
      expect(savedPurchaseOrder.createdAt).toBeInstanceOf(Date);
      expect(savedPurchaseOrder.updatedAt).toBeInstanceOf(Date);
    });

    it('應該在更新時更新updatedAt', async () => {
      const purchaseOrderData = {
        poid: 'PO001',
        posupplier: '測試供應商',
        items: []
      };

      const purchaseOrder = await new PurchaseOrder(purchaseOrderData).save();
      const originalUpdatedAt = purchaseOrder.updatedAt;
      
      // 等待一毫秒確保時間差異
      await new Promise(resolve => setTimeout(resolve, 1));
      
      purchaseOrder.notes = '更新的備註';
      const updatedPurchaseOrder = await purchaseOrder.save();
      
      expect(updatedPurchaseOrder.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});