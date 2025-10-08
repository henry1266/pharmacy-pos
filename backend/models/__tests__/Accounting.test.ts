import Accounting, { type IAccountingDocument } from '../../modules/daily-journals/Accounting';

describe('Accounting Model', () => {
  beforeEach(async () => {
    await Accounting.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('應該成功創建有效的記帳記錄', async () => {
      const accountingData = {
        date: new Date('2024-01-01'),
        status: 'pending' as const,
        shift: '早' as const,
        items: [
          {
            amount: 100,
            category: '銷售收入',
            categoryId: '507f1f77bcf86cd799439011',
            note: '現金銷售'
          }
        ],
        totalAmount: 100,
        createdBy: 'user123'
      };

      const accounting = new Accounting(accountingData);
      const savedAccounting = await accounting.save();

      expect(savedAccounting._id).toBeDefined();
      expect(savedAccounting.date).toEqual(accountingData.date);
      expect(savedAccounting.status).toBe(accountingData.status);
      expect(savedAccounting.shift).toBe(accountingData.shift);
      expect(savedAccounting.items).toHaveLength(1);
      expect(savedAccounting.totalAmount).toBe(accountingData.totalAmount);
    });

    it('應該要求必填欄位', async () => {
      const accounting = new Accounting({});
      await expect(accounting.save()).rejects.toThrow();
    });

    it('應該設置默認狀態為pending', async () => {
      const accountingData = {
        date: new Date(),
        shift: '早',
        createdBy: 'user123'
      };

      const accounting = new Accounting(accountingData);
      const savedAccounting = await accounting.save();

      expect(savedAccounting.status).toBe('pending');
    });
  });

  describe('Instance Methods', () => {
    let accounting: IAccountingDocument;

    beforeEach(async () => {
      accounting = await Accounting.create({
        date: new Date('2024-01-01'),
        shift: '早',
        createdBy: 'user123',
        items: [
          { amount: 100, category: '銷售', note: '現金' },
          { amount: 50, category: '服務', note: '小費' }
        ]
      });
    });

    describe('calculateTotalAmount', () => {
      it('應該正確計算總金額', () => {
        const total = accounting.calculateTotalAmount();
        expect(total).toBe(150);
      });
    });

    describe('addItem', () => {
      it('應該成功添加項目並更新總金額', () => {
        const newItem = { amount: 25, category: '折扣', note: '會員折扣' };

        accounting.addItem(newItem);

        expect(accounting.items).toHaveLength(3);
        expect(accounting.totalAmount).toBe(175);
      });
    });

    describe('removeItem', () => {
      it('應該成功移除項目並更新總金額', () => {
        accounting.removeItem(0);

        expect(accounting.items).toHaveLength(1);
        expect(accounting.totalAmount).toBe(50);
      });
    });

    describe('updateStatus', () => {
      it('應該成功更新狀態為completed', () => {
        accounting.updateStatus('completed');

        expect(accounting.status).toBe('completed');
      });
    });
  });
});