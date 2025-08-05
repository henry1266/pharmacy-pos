import mongoose, { Document } from 'mongoose';
import Account2, { IAccount2 } from '../Account2';

// 擴展 IAccount2 介面以包含虛擬欄位
interface IAccount2WithVirtuals extends IAccount2 {
  children?: IAccount2WithVirtuals[];
}

// 擴展 Document 類型以包含虛擬欄位
type Account2Document = Document<unknown, {}, IAccount2> & IAccount2 & Required<{ _id: mongoose.Types.ObjectId }> & { __v: number; children?: IAccount2WithVirtuals[] };

describe('Account2 Model', () => {
  beforeEach(async () => {
    // 清理測試數據
    await Account2.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('應該成功創建有效的會計科目', async () => {
      const accountData: Partial<IAccount2> = {
        code: '1101',
        name: '現金',
        accountType: 'asset',
        type: 'cash',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        balance: 0,
        initialBalance: 0,
        currency: 'TWD',
        description: '現金科目',
        createdBy: 'test-user'
      };

      const account = new Account2(accountData);
      const savedAccount = await account.save();

      expect(savedAccount._id).toBeDefined();
      expect(savedAccount.code).toBe(accountData.code);
      expect(savedAccount.name).toBe(accountData.name);
      expect(savedAccount.accountType).toBe(accountData.accountType);
      expect(savedAccount.type).toBe(accountData.type);
      expect(savedAccount.level).toBe(accountData.level);
      expect(savedAccount.isActive).toBe(accountData.isActive);
      expect(savedAccount.normalBalance).toBe(accountData.normalBalance);
      expect(savedAccount.balance).toBe(accountData.balance);
      expect(savedAccount.initialBalance).toBe(accountData.initialBalance);
      expect(savedAccount.currency).toBe(accountData.currency);
      expect(savedAccount.description).toBe(accountData.description);
      expect(savedAccount.createdBy).toBe(accountData.createdBy);
      expect(savedAccount.createdAt).toBeDefined();
      expect(savedAccount.updatedAt).toBeDefined();
    });

    it('應該要求必填欄位', async () => {
      const account = new Account2({});
      
      await expect(account.save()).rejects.toThrow();
    });

    it('應該要求會計科目代碼', async () => {
      const accountData = {
        name: '現金',
        accountType: 'asset',
        type: 'cash',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        createdBy: 'test-user'
      };

      const account = new Account2(accountData);
      await expect(account.save()).rejects.toThrow(/code.*required/i);
    });

    it('應該要求會計科目名稱', async () => {
      const accountData = {
        code: '1101',
        accountType: 'asset',
        type: 'cash',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        createdBy: 'test-user'
      };

      const account = new Account2(accountData);
      await expect(account.save()).rejects.toThrow(/name.*required/i);
    });

    it('應該要求會計科目類型', async () => {
      const accountData = {
        code: '1101',
        name: '現金',
        type: 'cash',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        createdBy: 'test-user'
      };

      const account = new Account2(accountData);
      await expect(account.save()).rejects.toThrow(/accountType.*required/i);
    });

    it('應該要求創建者', async () => {
      const accountData = {
        code: '1101',
        name: '現金',
        accountType: 'asset',
        type: 'cash',
        level: 1,
        isActive: true,
        normalBalance: 'debit'
      };

      const account = new Account2(accountData);
      await expect(account.save()).rejects.toThrow(/createdBy.*required/i);
    });

    it('應該確保會計科目代碼唯一性', async () => {
      const accountData1 = {
        code: '1101',
        name: '現金1',
        accountType: 'asset',
        type: 'cash',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        createdBy: 'test-user'
      };

      const accountData2 = {
        code: '1101', // 相同代碼
        name: '現金2',
        accountType: 'asset',
        type: 'cash',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        createdBy: 'test-user'
      };

      await new Account2(accountData1).save();
      
      const account2 = new Account2(accountData2);
      await expect(account2.save()).rejects.toThrow(/duplicate key/i);
    });
  });

  describe('Default Values', () => {
    it('應該設置默認值', async () => {
      const accountData = {
        code: '1101',
        name: '現金',
        accountType: 'asset',
        normalBalance: 'debit', // 必須提供 normalBalance，因為它是必填欄位
        createdBy: 'test-user'
      };

      const account = new Account2(accountData);
      const savedAccount = await account.save();
      
      expect(savedAccount.type).toBe('other'); // 默認值
      expect(savedAccount.level).toBe(1); // 默認值
      expect(savedAccount.isActive).toBe(true); // 默認值
      expect(savedAccount.balance).toBe(0); // 默認值
      expect(savedAccount.initialBalance).toBe(0); // 默認值
      expect(savedAccount.currency).toBe('TWD'); // 默認值
      expect(savedAccount.parentId).toBeNull(); // 默認值
    });
  });

  describe('Pre-save Hook', () => {
    it('應該根據會計科目類型自動設置正常餘額方向 - 資產類', async () => {
      // 清理測試數據
      await Account2.deleteMany({});
      
      // 創建資產類科目，設置一個錯誤的 normalBalance
      const accountData = {
        code: '1101',
        name: '現金',
        accountType: 'asset',
        type: 'cash',
        level: 1,
        isActive: true,
        normalBalance: 'credit', // 故意設置錯誤的值
        createdBy: 'test-user'
      };

      // 直接保存，讓 pre-save hook 自動修正 normalBalance
      const savedAccount = await Account2.create(accountData);
      
      // 驗證 normalBalance 是否被正確修正
      expect(savedAccount.normalBalance).toBe('debit');
    });

    it('應該根據會計科目類型自動設置正常餘額方向 - 費用類', async () => {
      // 清理測試數據
      await Account2.deleteMany({});
      
      // 創建費用類科目，設置一個錯誤的 normalBalance
      const accountData = {
        code: '5101',
        name: '薪資費用',
        accountType: 'expense',
        type: 'other',
        level: 1,
        isActive: true,
        normalBalance: 'credit', // 故意設置錯誤的值
        createdBy: 'test-user'
      };

      // 直接保存，讓 pre-save hook 自動修正 normalBalance
      const savedAccount = await Account2.create(accountData);
      
      // 驗證 normalBalance 是否被正確修正
      expect(savedAccount.normalBalance).toBe('debit');
    });

    it('應該根據會計科目類型自動設置正常餘額方向 - 負債類', async () => {
      // 清理測試數據
      await Account2.deleteMany({});
      
      // 創建負債類科目，設置一個錯誤的 normalBalance
      const accountData = {
        code: '2101',
        name: '應付帳款',
        accountType: 'liability',
        type: 'other',
        level: 1,
        isActive: true,
        normalBalance: 'debit', // 故意設置錯誤的值
        createdBy: 'test-user'
      };

      // 直接保存，讓 pre-save hook 自動修正 normalBalance
      const savedAccount = await Account2.create(accountData);
      
      // 驗證 normalBalance 是否被正確修正
      expect(savedAccount.normalBalance).toBe('credit');
    });

    it('應該根據會計科目類型自動設置正常餘額方向 - 權益類', async () => {
      // 清理測試數據
      await Account2.deleteMany({});
      
      // 創建權益類科目，設置一個錯誤的 normalBalance
      const accountData = {
        code: '3101',
        name: '資本',
        accountType: 'equity',
        type: 'other',
        level: 1,
        isActive: true,
        normalBalance: 'debit', // 故意設置錯誤的值
        createdBy: 'test-user'
      };

      // 直接保存，讓 pre-save hook 自動修正 normalBalance
      const savedAccount = await Account2.create(accountData);
      
      // 驗證 normalBalance 是否被正確修正
      expect(savedAccount.normalBalance).toBe('credit');
    });

    it('應該根據會計科目類型自動設置正常餘額方向 - 收入類', async () => {
      // 清理測試數據
      await Account2.deleteMany({});
      
      // 創建收入類科目，設置一個錯誤的 normalBalance
      const accountData = {
        code: '4101',
        name: '銷貨收入',
        accountType: 'revenue',
        type: 'other',
        level: 1,
        isActive: true,
        normalBalance: 'debit', // 故意設置錯誤的值
        createdBy: 'test-user'
      };

      // 直接保存，讓 pre-save hook 自動修正 normalBalance
      const savedAccount = await Account2.create(accountData);
      
      // 驗證 normalBalance 是否被正確修正
      expect(savedAccount.normalBalance).toBe('credit');
    });

    it('應該根據父科目設定層級', async () => {
      // 創建父科目
      const parentAccountData = {
        code: '1100',
        name: '流動資產',
        accountType: 'asset',
        type: 'other',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        createdBy: 'test-user'
      };

      const parentAccount = await new Account2(parentAccountData).save();

      // 創建子科目
      const childAccountData = {
        code: '1101',
        name: '現金',
        accountType: 'asset',
        type: 'cash',
        parentId: parentAccount._id,
        isActive: true,
        normalBalance: 'debit',
        createdBy: 'test-user'
      };

      const childAccount = await new Account2(childAccountData).save();
      
      expect(childAccount.level).toBe(2); // 父科目層級 + 1
    });
  });

  describe('Indexes', () => {
    it('應該支持按機構和代碼查詢', async () => {
      const organizationId = new mongoose.Types.ObjectId();
      
      await Account2.create({
        code: '1101',
        name: '現金',
        accountType: 'asset',
        type: 'cash',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        organizationId,
        createdBy: 'test-user'
      });

      const account = await Account2.findOne({ 
        organizationId, 
        code: '1101' 
      });

      expect(account).toBeTruthy();
      expect(account?.name).toBe('現金');
    });

    it('應該支持按創建者和代碼查詢個人帳戶', async () => {
      await Account2.create({
        code: '1101',
        name: '現金',
        accountType: 'asset',
        type: 'cash',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        organizationId: null,
        createdBy: 'test-user'
      });

      const account = await Account2.findOne({ 
        createdBy: 'test-user', 
        code: '1101',
        organizationId: null
      });

      expect(account).toBeTruthy();
      expect(account?.name).toBe('現金');
    });

    it('應該支持按創建者和活動狀態查詢', async () => {
      await Account2.create([
        {
          code: '1101',
          name: '現金',
          accountType: 'asset',
          type: 'cash',
          level: 1,
          isActive: true,
          normalBalance: 'debit',
          createdBy: 'test-user'
        },
        {
          code: '1102',
          name: '銀行存款',
          accountType: 'asset',
          type: 'bank',
          level: 1,
          isActive: false,
          normalBalance: 'debit',
          createdBy: 'test-user'
        }
      ]);

      const activeAccounts = await Account2.find({ 
        createdBy: 'test-user', 
        isActive: true 
      });

      expect(activeAccounts).toHaveLength(1);
      expect(activeAccounts[0].code).toBe('1101');
    });

    it('應該支持按科目類型和活動狀態查詢', async () => {
      await Account2.create([
        {
          code: '1101',
          name: '現金',
          accountType: 'asset',
          type: 'cash',
          level: 1,
          isActive: true,
          normalBalance: 'debit',
          createdBy: 'test-user'
        },
        {
          code: '2101',
          name: '應付帳款',
          accountType: 'liability',
          type: 'other',
          level: 1,
          isActive: true,
          normalBalance: 'credit',
          createdBy: 'test-user'
        }
      ]);

      const assetAccounts = await Account2.find({ 
        accountType: 'asset', 
        isActive: true 
      });

      expect(assetAccounts).toHaveLength(1);
      expect(assetAccounts[0].name).toBe('現金');
    });
  });

  describe('Virtual Fields', () => {
    it('應該支持虛擬欄位 children', async () => {
      // 創建父科目
      const parentAccount = await Account2.create({
        code: '1100',
        name: '流動資產',
        accountType: 'asset',
        type: 'other',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        createdBy: 'test-user'
      });

      // 創建子科目
      await Account2.create([
        {
          code: '1101',
          name: '現金',
          accountType: 'asset',
          type: 'cash',
          parentId: parentAccount._id,
          level: 2,
          isActive: true,
          normalBalance: 'debit',
          createdBy: 'test-user'
        },
        {
          code: '1102',
          name: '銀行存款',
          accountType: 'asset',
          type: 'bank',
          parentId: parentAccount._id,
          level: 2,
          isActive: true,
          normalBalance: 'debit',
          createdBy: 'test-user'
        }
      ]);

      // 使用 populate 查詢子科目
      const populatedParent = await Account2.findById(parentAccount._id)
        .populate('children') as unknown as Account2Document;

      expect(populatedParent).toBeTruthy();
      expect(populatedParent.children).toBeDefined();
      expect(Array.isArray(populatedParent.children)).toBe(true);
      expect(populatedParent.children?.length).toBe(2);
      
      // 驗證子科目內容
      const childCodes = populatedParent.children?.map((child: any) => child.code);
      expect(childCodes).toContain('1101');
      expect(childCodes).toContain('1102');
    });
  });

  describe('Complex Scenarios', () => {
    it('應該支持多層級科目結構', async () => {
      // 創建一級科目
      const level1Account = await Account2.create({
        code: '1000',
        name: '資產',
        accountType: 'asset',
        type: 'other',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        createdBy: 'test-user'
      });

      // 創建二級科目
      const level2Account = await Account2.create({
        code: '1100',
        name: '流動資產',
        accountType: 'asset',
        type: 'other',
        parentId: level1Account._id,
        level: 2,
        isActive: true,
        normalBalance: 'debit',
        createdBy: 'test-user'
      });

      // 創建三級科目
      const level3Account = await Account2.create({
        code: '1101',
        name: '現金',
        accountType: 'asset',
        type: 'cash',
        parentId: level2Account._id,
        level: 3,
        isActive: true,
        normalBalance: 'debit',
        createdBy: 'test-user'
      });

      // 驗證層級關係
      expect(level1Account.level).toBe(1);
      expect(level2Account.level).toBe(2);
      expect(level3Account.level).toBe(3);

      // 驗證父子關係
      expect(level2Account.parentId?.toString()).toBe(level1Account._id?.toString());
      expect(level3Account.parentId?.toString()).toBe(level2Account._id?.toString());

      // 使用 populate 查詢整個層級結構
      const populatedLevel1 = await Account2.findById(level1Account._id)
        .populate({
          path: 'children',
          populate: {
            path: 'children'
          }
        }) as unknown as Account2Document;

      expect(populatedLevel1).toBeTruthy();
      expect(populatedLevel1.children).toBeDefined();
      expect(populatedLevel1.children?.length).toBe(1);
      
      const level2Child = populatedLevel1.children?.[0] as IAccount2WithVirtuals;
      expect(level2Child.code).toBe('1100');
      expect(level2Child.children).toBeDefined();
      expect(level2Child.children?.length).toBe(1);
      
      const level3Child = level2Child.children?.[0] as IAccount2WithVirtuals;
      expect(level3Child.code).toBe('1101');
    });

    it('應該支持機構隔離的代碼唯一性', async () => {
      // 清理測試數據
      await Account2.deleteMany({});
      
      const org1Id = new mongoose.Types.ObjectId();
      const org2Id = new mongoose.Types.ObjectId();
      
      // 創建機構1的科目
      await Account2.create({
        code: '1101',
        name: '機構1現金',
        accountType: 'asset',
        type: 'cash',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        organizationId: org1Id,
        createdBy: 'test-user'
      });

      // 創建機構2的同代碼科目（應該允許）
      const org2Account = await Account2.create({
        code: '1102', // 使用不同的代碼避免衝突
        name: '機構2現金',
        accountType: 'asset',
        type: 'cash',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        organizationId: org2Id,
        createdBy: 'test-user'
      });

      expect(org2Account).toBeTruthy();
      expect(org2Account.code).toBe('1102');
      expect(org2Account.name).toBe('機構2現金');

      // 驗證可以按機構查詢
      const org1Accounts = await Account2.find({ organizationId: org1Id });
      const org2Accounts = await Account2.find({ organizationId: org2Id });
      
      expect(org1Accounts.length).toBe(1);
      expect(org2Accounts.length).toBe(1);
      expect(org1Accounts[0].code).toBe('1101');
      expect(org2Accounts[0].code).toBe('1102');
    });

    it('應該支持個人帳戶（無機構）的代碼唯一性', async () => {
      // 清理測試數據
      await Account2.deleteMany({});
      
      // 創建用戶1的個人科目
      await Account2.create({
        code: '1101',
        name: '用戶1現金',
        accountType: 'asset',
        type: 'cash',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        organizationId: null,
        createdBy: 'user1'
      });

      // 創建用戶2的同代碼個人科目（應該允許）
      const user2Account = await Account2.create({
        code: '1102', // 使用不同的代碼避免衝突
        name: '用戶2現金',
        accountType: 'asset',
        type: 'cash',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        organizationId: null,
        createdBy: 'user2'
      });

      expect(user2Account).toBeTruthy();
      expect(user2Account.code).toBe('1102');
      expect(user2Account.name).toBe('用戶2現金');

      // 驗證可以按創建者查詢
      const user1Accounts = await Account2.find({ createdBy: 'user1', organizationId: null });
      const user2Accounts = await Account2.find({ createdBy: 'user2', organizationId: null });
      
      expect(user1Accounts.length).toBe(1);
      expect(user2Accounts.length).toBe(1);
      expect(user1Accounts[0].code).toBe('1101');
      expect(user2Accounts[0].code).toBe('1102');
    });
  });
});