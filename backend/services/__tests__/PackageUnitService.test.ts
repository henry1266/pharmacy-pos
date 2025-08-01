import { PackageUnitService } from '../PackageUnitService';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';

describe('PackageUnitService', () => {
  
  // 測試用的包裝單位配置
  const mockPackageUnits: Omit<ProductPackageUnit, '_id' | 'productId' | 'createdAt' | 'updatedAt'>[] = [
    {
      unitName: '盒',
      unitValue: 1000,
      isBaseUnit: false,
      isActive: true
    },
    {
      unitName: '排',
      unitValue: 10,
      isBaseUnit: false,
      isActive: true
    },
    {
      unitName: '粒',
      unitValue: 1,
      isBaseUnit: true,
      isActive: true
    }
  ];

  const mockFullPackageUnits: ProductPackageUnit[] = mockPackageUnits.map((unit, index) => ({
    ...unit,
    _id: `unit_${index}`,
    productId: 'product_123',
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  describe('validatePackageUnits', () => {
    
    it('應該驗證有效的包裝單位配置', () => {
      const result = PackageUnitService.validatePackageUnits(mockPackageUnits);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('應該允許沒有基礎單位的配置', () => {
      const unitsWithoutBase = mockPackageUnits.map(unit => ({
        ...unit,
        isBaseUnit: false
      }));
      
      const result = PackageUnitService.validatePackageUnits(unitsWithoutBase);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('應該檢測多個基礎單位的錯誤', () => {
      const unitsWithMultipleBase = mockPackageUnits.map(unit => ({
        ...unit,
        isBaseUnit: true
      }));
      
      const result = PackageUnitService.validatePackageUnits(unitsWithMultipleBase);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('只能有一個基礎單位');
    });

    it('應該對基礎單位數值不為1產生警告', () => {
      const unitsWithWrongBaseValue = mockPackageUnits.map(unit =>
        unit.isBaseUnit ? { ...unit, unitValue: 5 } : unit
      );
      
      const result = PackageUnitService.validatePackageUnits(unitsWithWrongBaseValue);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('建議基礎單位的數值設為 1');
    });

    it('應該檢測重複的單位名稱', () => {
      const unitsWithDuplicateNames = [
        ...mockPackageUnits,
        { ...mockPackageUnits[0], unitValue: 2000 } // 不同的 unitValue 但相同的 unitName
      ];
      
      const result = PackageUnitService.validatePackageUnits(unitsWithDuplicateNames);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('單位名稱重複'))).toBe(true);
    });

    it('應該檢測重複的包裝數量', () => {
      const unitsWithDuplicateValues = mockPackageUnits.map((unit, index) =>
        index === 0 ? { ...unit, unitValue: 10, unitName: '大排' } : unit // 與 '排' 相同的 unitValue
      );
      
      const result = PackageUnitService.validatePackageUnits(unitsWithDuplicateValues);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('包裝數量重複'))).toBe(true);
    });

    it('應該檢測無效的數值', () => {
      const unitsWithInvalidValue = mockPackageUnits.map((unit, index) => 
        index === 0 ? { ...unit, unitValue: -1 } : unit
      );
      
      const result = PackageUnitService.validatePackageUnits(unitsWithInvalidValue);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('數值必須為正整數'))).toBe(true);
    });

    it('應該產生整除關係的警告', () => {
      const unitsWithBadDivisibility = [
        {
          unitName: '盒',
          unitValue: 1000,
          isBaseUnit: false,
          isActive: true
        },
        {
          unitName: '排',
          unitValue: 7, // 1000 不能被 7 整除
          isBaseUnit: false,
          isActive: true
        },
        {
          unitName: '粒',
          unitValue: 1,
          isBaseUnit: true,
          isActive: true
        }
      ];
      
      const result = PackageUnitService.validatePackageUnits(unitsWithBadDivisibility);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(warning => warning.includes('無法被'))).toBe(true);
    });
  });

  describe('convertToPackageDisplay', () => {
    
    it('應該正確轉換基礎單位為包裝顯示 - 標準案例', () => {
      const result = PackageUnitService.convertToPackageDisplay(1635, mockFullPackageUnits);
      
      expect(result.baseQuantity).toBe(1635);
      expect(result.displayText).toBe('1盒 63排 5粒');
      expect(result.packageBreakdown).toEqual([
        { unitName: '盒', quantity: 1, unitValue: 1000 },
        { unitName: '排', quantity: 63, unitValue: 10 },
        { unitName: '粒', quantity: 5, unitValue: 1 }
      ]);
    });

    it('應該正確轉換基礎單位為包裝顯示 - 整數倍案例', () => {
      const result = PackageUnitService.convertToPackageDisplay(2000, mockFullPackageUnits);
      
      expect(result.baseQuantity).toBe(2000);
      expect(result.displayText).toBe('2盒');
      expect(result.packageBreakdown).toEqual([
        { unitName: '盒', quantity: 2, unitValue: 1000 }
      ]);
    });

    it('應該正確轉換基礎單位為包裝顯示 - 小於最小包裝案例', () => {
      const result = PackageUnitService.convertToPackageDisplay(5, mockFullPackageUnits);
      
      expect(result.baseQuantity).toBe(5);
      expect(result.displayText).toBe('5粒');
      expect(result.packageBreakdown).toEqual([
        { unitName: '粒', quantity: 5, unitValue: 1 }
      ]);
    });

    it('應該處理零數量', () => {
      const result = PackageUnitService.convertToPackageDisplay(0, mockFullPackageUnits);
      
      expect(result.baseQuantity).toBe(0);
      expect(result.displayText).toBe('0');
      expect(result.packageBreakdown).toEqual([]);
    });

    it('應該處理負數量', () => {
      const result = PackageUnitService.convertToPackageDisplay(-10, mockFullPackageUnits);
      
      expect(result.baseQuantity).toBe(0);
      expect(result.displayText).toBe('0');
      expect(result.packageBreakdown).toEqual([]);
    });

    it('應該處理空的包裝單位配置', () => {
      const result = PackageUnitService.convertToPackageDisplay(1635, []);
      
      expect(result.baseQuantity).toBe(1635);
      expect(result.displayText).toBe('1635');
      expect(result.packageBreakdown).toEqual([]);
    });

    it('應該只使用啟用的包裝單位', () => {
      const unitsWithInactive = mockFullPackageUnits.map(unit => 
        unit.unitName === '排' ? { ...unit, isActive: false } : unit
      );
      
      const result = PackageUnitService.convertToPackageDisplay(1635, unitsWithInactive);
      
      expect(result.displayText).toBe('1盒 635粒');
      expect(result.packageBreakdown).toEqual([
        { unitName: '盒', quantity: 1, unitValue: 1000 },
        { unitName: '粒', quantity: 635, unitValue: 1 }
      ]);
    });
  });

  describe('convertToBaseUnit', () => {
    
    it('應該正確解析包裝單位輸入 - 完整格式', () => {
      const result = PackageUnitService.convertToBaseUnit('1盒 5排 3粒', mockFullPackageUnits);
      
      expect(result.baseQuantity).toBe(1053); // 1*1000 + 5*10 + 3*1
      expect(result.displayText).toBe('1盒 5排 3粒');
      expect(result.parsedInput).toEqual([
        { unitName: '盒', quantity: 1 },
        { unitName: '排', quantity: 5 },
        { unitName: '粒', quantity: 3 }
      ]);
      expect(result.errors).toEqual([]);
    });

    it('應該正確解析包裝單位輸入 - 部分格式', () => {
      const result = PackageUnitService.convertToBaseUnit('2盒 3粒', mockFullPackageUnits);
      
      expect(result.baseQuantity).toBe(2003); // 2*1000 + 3*1
      expect(result.displayText).toBe('2盒 3粒');
      expect(result.parsedInput).toEqual([
        { unitName: '盒', quantity: 2 },
        { unitName: '粒', quantity: 3 }
      ]);
    });

    it('應該正確解析純數字輸入', () => {
      const result = PackageUnitService.convertToBaseUnit('1500', mockFullPackageUnits);
      
      expect(result.baseQuantity).toBe(1500);
      expect(result.displayText).toBe('1500');
      expect(result.parsedInput).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('應該處理未知單位名稱', () => {
      const result = PackageUnitService.convertToBaseUnit('1箱 2盒', mockFullPackageUnits);
      
      expect(result.baseQuantity).toBe(2000); // 只計算 2盒
      expect(result.errors).toContain('未知的單位名稱: "箱"');
    });

    it('應該處理空輸入', () => {
      const result = PackageUnitService.convertToBaseUnit('', mockFullPackageUnits);
      
      expect(result.baseQuantity).toBe(0);
      expect(result.errors).toContain('輸入不能為空');
    });

    it('應該處理無效格式', () => {
      const result = PackageUnitService.convertToBaseUnit('abc def', mockFullPackageUnits);
      
      expect(result.baseQuantity).toBe(0);
      expect(result.errors).toContain('無法解析輸入格式，請使用如 "1盒 5排 3粒" 的格式');
    });

    it('應該處理混合有效和無效輸入', () => {
      const result = PackageUnitService.convertToBaseUnit('1盒 2xyz 5粒', mockFullPackageUnits);
      
      expect(result.baseQuantity).toBe(1005); // 1*1000 + 5*1 (2xyz 被忽略)
      expect(result.displayText).toBe('1盒 5粒');
      // 檢查是否有錯誤
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.errors!.some(error => error.includes('xyz'))).toBe(true);
    });
  });

  describe('邊界條件測試', () => {
    
    it('應該處理非常大的數量', () => {
      const largeQuantity = 999999999;
      const result = PackageUnitService.convertToPackageDisplay(largeQuantity, mockFullPackageUnits);
      
      expect(result.baseQuantity).toBe(largeQuantity);
      expect(result.packageBreakdown[0].quantity).toBe(Math.floor(largeQuantity / 1000));
    });

    it('應該處理浮點數輸入（應該被截斷）', () => {
      const result = PackageUnitService.convertToPackageDisplay(1635.7, mockFullPackageUnits);
      
      // 由於我們的驗證會檢查是否為整數，這裡應該返回0
      expect(result.baseQuantity).toBe(0);
      expect(result.displayText).toBe('0');
    });

    it('應該處理單一包裝單位配置', () => {
      const singleUnit: ProductPackageUnit[] = [{
        _id: 'unit_1',
        productId: 'product_123',
        unitName: '個',
        unitValue: 1,
        isBaseUnit: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }];
      
      const result = PackageUnitService.convertToPackageDisplay(100, singleUnit);
      
      expect(result.displayText).toBe('100個');
    });
  });

  describe('實際使用案例測試', () => {
    
    it('藥品包裝案例：1635粒 = 1盒63排5粒', () => {
      const result = PackageUnitService.convertToPackageDisplay(1635, mockFullPackageUnits);
      expect(result.displayText).toBe('1盒 63排 5粒');
    });

    it('藥品包裝案例：輸入 "1盒 5排 3粒" = 1053粒', () => {
      const result = PackageUnitService.convertToBaseUnit('1盒 5排 3粒', mockFullPackageUnits);
      expect(result.baseQuantity).toBe(1053);
    });

    it('藥品包裝案例：輸入 "2盒" = 2000粒', () => {
      const result = PackageUnitService.convertToBaseUnit('2盒', mockFullPackageUnits);
      expect(result.baseQuantity).toBe(2000);
    });

    it('藥品包裝案例：輸入 "50排" = 500粒', () => {
      const result = PackageUnitService.convertToBaseUnit('50排', mockFullPackageUnits);
      expect(result.baseQuantity).toBe(500);
    });

    it('雙向轉換一致性測試', () => {
      const originalQuantity = 1635;
      
      // 基礎單位 → 包裝顯示
      const displayResult = PackageUnitService.convertToPackageDisplay(originalQuantity, mockFullPackageUnits);
      
      // 包裝顯示 → 基礎單位
      const backToBaseResult = PackageUnitService.convertToBaseUnit(displayResult.displayText, mockFullPackageUnits);
      
      expect(backToBaseResult.baseQuantity).toBe(originalQuantity);
    });
  });
});