import BaseProduct, { Product, Medicine } from '../BaseProduct';
import { ProductType } from '@pharmacy-pos/shared/enums';

describe('BaseProduct Model', () => {
  beforeEach(async () => {
    // 清理測試數據
    await BaseProduct.deleteMany({});
  });

  describe('BaseProduct Schema Validation', () => {
    it('應該成功創建有效的基礎產品', async () => {
      const productData = {
        code: 'PROD001',
        shortCode: 'P001',
        name: '測試產品',
        subtitle: '測試副標題',
        unit: '盒',
        purchasePrice: 100,
        sellingPrice: 150,
        description: '這是一個測試產品',
        minStock: 10,
        productType: ProductType.PRODUCT,
        isActive: true,
        excludeFromStock: false,
        barcode: '1234567890123',
        healthInsuranceCode: 'HC001'
      };

      const product = new BaseProduct(productData);
      const savedProduct = await product.save();

      expect(savedProduct._id).toBeDefined();
      expect(savedProduct.code).toBe(productData.code);
      expect(savedProduct.shortCode).toBe(productData.shortCode);
      expect(savedProduct.name).toBe(productData.name);
      expect(savedProduct.subtitle).toBe(productData.subtitle);
      expect(savedProduct.unit).toBe(productData.unit);
      expect(savedProduct.purchasePrice).toBe(productData.purchasePrice);
      expect(savedProduct.sellingPrice).toBe(productData.sellingPrice);
      expect(savedProduct.description).toBe(productData.description);
      expect(savedProduct.minStock).toBe(productData.minStock);
      expect(savedProduct.productType).toBe(productData.productType);
      expect(savedProduct.isActive).toBe(productData.isActive);
      expect(savedProduct.excludeFromStock).toBe(productData.excludeFromStock);
      expect(savedProduct.barcode).toBe(productData.barcode);
      expect(savedProduct.healthInsuranceCode).toBe(productData.healthInsuranceCode);
      expect((savedProduct as any).createdAt).toBeDefined();
      expect((savedProduct as any).updatedAt).toBeDefined();
    });

    it('應該要求必填欄位', async () => {
      const product = new BaseProduct({});
      
      await expect(product.save()).rejects.toThrow();
    });

    it('應該要求產品代碼', async () => {
      const productData = {
        name: '測試產品',
        productType: ProductType.PRODUCT
      };

      const product = new BaseProduct(productData);
      await expect(product.save()).rejects.toThrow(/code.*required/i);
    });

    it('應該要求產品名稱', async () => {
      const productData = {
        code: 'PROD001',
        productType: ProductType.PRODUCT
      };

      const product = new BaseProduct(productData);
      await expect(product.save()).rejects.toThrow(/name.*required/i);
    });

    it('應該要求產品類型', async () => {
      const productData = {
        code: 'PROD001',
        name: '測試產品'
      };

      const product = new BaseProduct(productData);
      await expect(product.save()).rejects.toThrow(/productType.*required/i);
    });

    it('應該確保產品代碼唯一性', async () => {
      const productData1 = {
        code: 'PROD001',
        name: '產品1',
        productType: ProductType.PRODUCT
      };

      const productData2 = {
        code: 'PROD001', // 相同代碼
        name: '產品2',
        productType: ProductType.PRODUCT
      };

      await new BaseProduct(productData1).save();
      
      const product2 = new BaseProduct(productData2);
      await expect(product2.save()).rejects.toThrow(/duplicate key/i);
    });

    it('應該驗證產品類型枚舉值', async () => {
      const productData = {
        code: 'PROD001',
        name: '測試產品',
        productType: 'invalid_type' as any
      };

      const product = new BaseProduct(productData);
      await expect(product.save()).rejects.toThrow();
    });

    it('應該設置默認值', async () => {
      const productData = {
        code: 'PROD001',
        name: '測試產品',
        productType: ProductType.PRODUCT
      };

      const product = new BaseProduct(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.purchasePrice).toBe(0);
      expect(savedProduct.sellingPrice).toBe(0);
      expect(savedProduct.minStock).toBe(10);
      expect(savedProduct.isActive).toBe(true);
      expect(savedProduct.excludeFromStock).toBe(false);
      expect(savedProduct.enablePackageMode).toBe(false);
      expect(savedProduct.date).toBeDefined();
    });
  });

  describe('Product Discriminator', () => {
    it('應該成功創建Product類型', async () => {
      const productData = {
        code: 'PROD001',
        name: '一般商品',
        productType: ProductType.PRODUCT,
        purchasePrice: 50,
        sellingPrice: 80
      };

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.productType).toBe(ProductType.PRODUCT);
      expect(savedProduct.code).toBe(productData.code);
      expect(savedProduct.name).toBe(productData.name);
      expect(savedProduct.purchasePrice).toBe(productData.purchasePrice);
      expect(savedProduct.sellingPrice).toBe(productData.sellingPrice);
    });
  });

  describe('Medicine Discriminator', () => {
    it('應該成功創建Medicine類型', async () => {
      const medicineData = {
        code: 'MED001',
        name: '測試藥品',
        productType: ProductType.MEDICINE,
        purchasePrice: 100,
        sellingPrice: 150,
        healthInsurancePrice: 120,
        medicineInfo: {
          licenseNumber: 'LIC001',
          ingredients: '主要成分A, 成分B',
          dosage: '每日三次，每次一顆',
          sideEffects: '可能引起頭暈',
          contraindications: '孕婦禁用',
          storageConditions: '室溫保存',
          manufacturer: '測試製藥公司',
          approvalNumber: 'APP001',
          expiryDate: new Date('2025-12-31')
        }
      };

      const medicine = new Medicine(medicineData);
      const savedMedicine = await medicine.save();

      expect(savedMedicine.productType).toBe(ProductType.MEDICINE);
      expect(savedMedicine.code).toBe(medicineData.code);
      expect(savedMedicine.name).toBe(medicineData.name);
      expect(savedMedicine.purchasePrice).toBe(medicineData.purchasePrice);
      expect(savedMedicine.sellingPrice).toBe(medicineData.sellingPrice);
      expect((savedMedicine as any).healthInsurancePrice).toBe(medicineData.healthInsurancePrice);
      expect((savedMedicine as any).medicineInfo).toEqual(medicineData.medicineInfo);
    });

    it('應該設置藥品的默認健保價格', async () => {
      const medicineData = {
        code: 'MED002',
        name: '測試藥品2',
        productType: ProductType.MEDICINE
      };

      const medicine = new Medicine(medicineData);
      const savedMedicine = await medicine.save();
      
      expect((savedMedicine as any).healthInsurancePrice).toBe(0);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // 創建測試數據
      await BaseProduct.create([
        {
          code: 'PROD001',
          name: '產品1',
          productType: ProductType.PRODUCT
        },
        {
          code: 'MED001',
          name: '藥品1',
          productType: ProductType.MEDICINE
        }
      ]);
    });

    describe('findByCode', () => {
      it('應該能夠按代碼查找產品', async () => {
        const product = await BaseProduct.findByCode('PROD001');
        
        expect(product).toBeTruthy();
        expect(product?.code).toBe('PROD001');
        expect(product?.name).toBe('產品1');
      });

      it('應該在找不到產品時返回null', async () => {
        const product = await BaseProduct.findByCode('NONEXISTENT');
        
        expect(product).toBeNull();
      });
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      // 創建測試數據
      await BaseProduct.create([
        {
          code: 'PROD001',
          name: '活躍產品',
          productType: ProductType.PRODUCT,
          isActive: true,
          purchasePrice: 50,
          sellingPrice: 80
        },
        {
          code: 'PROD002',
          name: '非活躍產品',
          productType: ProductType.PRODUCT,
          isActive: false,
          purchasePrice: 30,
          sellingPrice: 50
        },
        {
          code: 'MED001',
          name: '測試藥品',
          productType: ProductType.MEDICINE,
          isActive: true,
          purchasePrice: 100,
          sellingPrice: 150
        }
      ]);
    });

    it('應該能夠查詢活躍產品', async () => {
      const activeProducts = await BaseProduct.find({ isActive: true });
      expect(activeProducts).toHaveLength(2);
    });

    it('應該能夠按產品類型查詢', async () => {
      const products = await BaseProduct.find({ productType: ProductType.PRODUCT });
      expect(products).toHaveLength(2);
      
      const medicines = await BaseProduct.find({ productType: ProductType.MEDICINE });
      expect(medicines).toHaveLength(1);
    });

    it('應該能夠按價格範圍查詢', async () => {
      const expensiveProducts = await BaseProduct.find({ 
        sellingPrice: { $gte: 100 } 
      });
      expect(expensiveProducts).toHaveLength(1);
      expect(expensiveProducts[0].productType).toBe(ProductType.MEDICINE);
    });

    it('應該能夠按代碼查詢', async () => {
      const product = await BaseProduct.findOne({ code: 'PROD001' });
      expect(product).toBeTruthy();
      expect(product?.name).toBe('活躍產品');
    });
  });

  describe('Package Mode Features', () => {
    it('應該支援包裝模式設定', async () => {
      const productData = {
        code: 'PROD001',
        name: '包裝產品',
        productType: ProductType.PRODUCT,
        enablePackageMode: true,
        defaultDisplayUnit: '盒'
      };

      const product = new BaseProduct(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.enablePackageMode).toBe(true);
      expect(savedProduct.defaultDisplayUnit).toBe('盒');
    });
  });

  describe('Barcode and Health Insurance', () => {
    it('應該支援條碼和健保代碼', async () => {
      const productData = {
        code: 'PROD001',
        name: '有條碼的產品',
        productType: ProductType.PRODUCT,
        barcode: '1234567890123',
        healthInsuranceCode: 'HC001'
      };

      const product = new BaseProduct(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.barcode).toBe('1234567890123');
      expect(savedProduct.healthInsuranceCode).toBe('HC001');
    });

    it('應該修剪條碼和健保代碼的空白', async () => {
      const productData = {
        code: 'PROD001',
        name: '測試產品',
        productType: ProductType.PRODUCT,
        barcode: '  1234567890123  ',
        healthInsuranceCode: '  HC001  '
      };

      const product = new BaseProduct(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.barcode).toBe('1234567890123');
      expect(savedProduct.healthInsuranceCode).toBe('HC001');
    });
  });

  describe('Timestamps', () => {
    it('應該自動設置createdAt和updatedAt', async () => {
      const productData = {
        code: 'PROD001',
        name: '測試產品',
        productType: ProductType.PRODUCT
      };

      const product = new BaseProduct(productData);
      const savedProduct = await product.save();
      
      expect((savedProduct as any).createdAt).toBeDefined();
      expect((savedProduct as any).updatedAt).toBeDefined();
      expect((savedProduct as any).createdAt).toBeInstanceOf(Date);
      expect((savedProduct as any).updatedAt).toBeInstanceOf(Date);
    });

    it('應該在更新時更新updatedAt', async () => {
      const productData = {
        code: 'PROD001',
        name: '測試產品',
        productType: ProductType.PRODUCT
      };

      const product = await new BaseProduct(productData).save();
      const originalUpdatedAt = (product as any).updatedAt;
      
      // 等待一毫秒確保時間差異
      await new Promise(resolve => setTimeout(resolve, 1));
      
      product.name = '更新的產品名稱';
      const updatedProduct = await product.save();
      
      expect((updatedProduct as any).updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Complex Scenarios', () => {
    it('應該處理完整的產品生命週期', async () => {
      // 創建新產品
      const product = await BaseProduct.create({
        code: 'PROD001',
        name: '測試產品',
        productType: ProductType.PRODUCT,
        purchasePrice: 50,
        sellingPrice: 80,
        minStock: 10,
        isActive: true
      });

      expect(product.isActive).toBe(true);
      expect(product.minStock).toBe(10);

      // 更新產品資訊
      product.sellingPrice = 90;
      product.minStock = 15;
      await product.save();

      expect(product.sellingPrice).toBe(90);
      expect(product.minStock).toBe(15);

      // 停用產品
      product.isActive = false;
      await product.save();

      expect(product.isActive).toBe(false);
    });

    it('應該處理藥品的完整資訊', async () => {
      const medicine = await Medicine.create({
        code: 'MED001',
        name: '複合維他命',
        productType: ProductType.MEDICINE,
        purchasePrice: 80,
        sellingPrice: 120,
        healthInsurancePrice: 100,
        medicineInfo: {
          licenseNumber: 'LIC12345',
          ingredients: '維他命A, 維他命B, 維他命C',
          dosage: '每日一次，每次一顆',
          sideEffects: '極少數人可能出現輕微胃部不適',
          contraindications: '對任何成分過敏者禁用',
          storageConditions: '室溫保存，避免陽光直射',
          manufacturer: '健康製藥股份有限公司',
          approvalNumber: 'APP67890'
        }
      });

      expect(medicine.productType).toBe(ProductType.MEDICINE);
      expect((medicine as any).healthInsurancePrice).toBe(100);
      expect((medicine as any).medicineInfo.licenseNumber).toBe('LIC12345');
      expect((medicine as any).medicineInfo.ingredients).toContain('維他命A');
    });
  });
});