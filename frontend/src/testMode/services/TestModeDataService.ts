import TestModeConfig from '../config/TestModeConfig';
import {
  getAllTestModeData,
  getTestSuppliers,
  getTestCustomers,
  getTestProducts,
  getTestCategories,
  getTestSales,
  getTestEmployees,
  getTestDashboardData,
  getTestSalesTrend,
  getTestCategorySales,
  mockPurchaseOrderProducts,
  mockPurchaseOrderSuppliers,
  type TestSupplierData,
  type TestCustomerData,
  type TestEmployeeData,
  type MockDashboardData,
  type TestPurchaseOrderProduct,
  type TestPurchaseOrderSupplier,
  type ExtendedSale
} from '../data/TestModeData';
import type { Product, Customer, Sale, Category } from '@pharmacy-pos/shared/types/entities';
import type { SalesTrend, CategorySales } from '../../services/dashboardService';

/**
 * 測試模式數據服務
 * 統一管理測試模式下的數據獲取邏輯
 */
class TestModeDataService {
  /**
   * 檢查是否應該使用測試數據
   * 當測試模式啟用時，總是使用測試數據
   */
  private shouldUseTestData(actualData: unknown, actualError: unknown): boolean {
    // 測試模式啟用時，總是使用測試數據
    return TestModeConfig.isEnabled();
  }

  /**
   * 獲取供應商數據
   */
  getSuppliers(actualSuppliers: TestSupplierData[] | null, actualError: string | null): TestSupplierData[] {
    if (TestModeConfig.isEnabled()) {
      if (this.shouldUseTestData(actualSuppliers, actualError)) {
        console.log('測試模式：使用模擬供應商數據');
        return getTestSuppliers();
      }
      return actualSuppliers || [];
    }
    return actualSuppliers || [];
  }

  /**
   * 獲取客戶數據
   */
  getCustomers(actualCustomers: TestCustomerData[] | null, actualError: string | null): TestCustomerData[] {
    if (TestModeConfig.isEnabled()) {
      if (this.shouldUseTestData(actualCustomers, actualError)) {
        console.log('測試模式：使用模擬客戶數據');
        return getTestCustomers();
      }
      return actualCustomers || [];
    }
    return actualCustomers || [];
  }

  /**
   * 獲取產品數據
   */
  getProducts(actualProducts: Product[] | null, actualError: string | null): Product[] {
    if (TestModeConfig.isEnabled()) {
      if (this.shouldUseTestData(actualProducts, actualError)) {
        console.log('測試模式：使用模擬產品數據');
        return getTestProducts();
      }
      return actualProducts || [];
    }
    return actualProducts || [];
  }

  /**
   * 獲取產品分類數據
   */
  getCategories(actualCategories: Category[] | null, actualError: string | null): Category[] {
    if (TestModeConfig.isEnabled()) {
      if (this.shouldUseTestData(actualCategories, actualError)) {
        console.log('測試模式：使用模擬產品分類數據');
        return getTestCategories();
      }
      return actualCategories || [];
    }
    return actualCategories || [];
  }

  /**
   * 獲取銷售數據
   */
  getSales(actualSales: ExtendedSale[] | null, actualError: string | null): ExtendedSale[] {
    if (TestModeConfig.isEnabled()) {
      if (this.shouldUseTestData(actualSales, actualError)) {
        console.log('測試模式：使用模擬銷售數據');
        return getTestSales();
      }
      return actualSales || [];
    }
    return actualSales || [];
  }

  /**
   * 獲取員工數據
   */
  getEmployees(actualEmployees: TestEmployeeData[] | null, actualError: string | null): TestEmployeeData[] {
    if (TestModeConfig.isEnabled()) {
      if (this.shouldUseTestData(actualEmployees, actualError)) {
        console.log('測試模式：使用模擬員工數據');
        return getTestEmployees();
      }
      return actualEmployees || [];
    }
    return actualEmployees || [];
  }

  /**
   * 獲取 Dashboard 摘要數據
   */
  getDashboardData(actualDashboardData: MockDashboardData | null, actualError: string | null): MockDashboardData | null {
    if (TestModeConfig.isEnabled()) {
      if (this.shouldUseTestData(actualDashboardData, actualError)) {
        console.log('測試模式：使用模擬 Dashboard 數據');
        return getTestDashboardData();
      }
      return actualDashboardData;
    }
    return actualDashboardData;
  }

  /**
   * 獲取銷售趨勢數據
   */
  getSalesTrend(actualSalesTrend: SalesTrend[] | null, actualError: string | null): SalesTrend[] {
    if (TestModeConfig.isEnabled()) {
      if (this.shouldUseTestData(actualSalesTrend, actualError)) {
        console.log('測試模式：使用模擬銷售趨勢數據');
        return getTestSalesTrend();
      }
      return actualSalesTrend || [];
    }
    return actualSalesTrend || [];
  }

  /**
   * 獲取分類銷售數據
   */
  getCategorySales(actualCategorySales: CategorySales[] | null, actualError: string | null): CategorySales[] {
    if (TestModeConfig.isEnabled()) {
      if (this.shouldUseTestData(actualCategorySales, actualError)) {
        console.log('測試模式：使用模擬分類銷售數據');
        return getTestCategorySales();
      }
      return actualCategorySales || [];
    }
    return actualCategorySales || [];
  }

  /**
   * 獲取進貨單產品數據
   */
  getPurchaseOrderProducts(actualProducts: TestPurchaseOrderProduct[] | null, actualError: string | null): TestPurchaseOrderProduct[] {
    if (TestModeConfig.isEnabled()) {
      if (this.shouldUseTestData(actualProducts, actualError)) {
        console.log('測試模式：使用模擬進貨單產品數據');
        return mockPurchaseOrderProducts;
      }
      return actualProducts || [];
    }
    return actualProducts || [];
  }

  /**
   * 獲取進貨單供應商數據
   */
  getPurchaseOrderSuppliers(actualSuppliers: TestPurchaseOrderSupplier[] | null, actualError: string | null): TestPurchaseOrderSupplier[] {
    if (TestModeConfig.isEnabled()) {
      if (this.shouldUseTestData(actualSuppliers, actualError)) {
        console.log('測試模式：使用模擬進貨單供應商數據');
        return mockPurchaseOrderSuppliers;
      }
      return actualSuppliers || [];
    }
    return actualSuppliers || [];
  }

  /**
   * 獲取載入狀態
   * 測試模式下不顯示載入狀態
   */
  getLoadingState(actualLoading: boolean): boolean {
    if (TestModeConfig.isEnabled()) {
      return false; // 測試模式下不顯示載入狀態
    }
    return actualLoading;
  }

  /**
   * 獲取錯誤狀態
   * 測試模式下如果有測試數據可用，不顯示錯誤
   */
  getErrorState(actualError: string | null): string | null {
    if (TestModeConfig.isEnabled()) {
      return null; // 測試模式下不顯示錯誤，因為總是有測試數據可用
    }
    return actualError;
  }

  /**
   * 模擬 API 操作成功
   */
  simulateApiSuccess(operation: string): Promise<boolean> {
    return new Promise((resolve) => {
      console.log(`測試模式：模擬 ${operation} 操作成功`);
      setTimeout(() => resolve(true), 500); // 模擬網路延遲
    });
  }

  /**
   * 模擬 API 操作失敗
   */
  simulateApiError(operation: string, errorMessage?: string): Promise<never> {
    return new Promise((_, reject) => {
      console.log(`測試模式：模擬 ${operation} 操作失敗`);
      setTimeout(() => reject(new Error(errorMessage || `模擬的 ${operation} 錯誤`)), 500);
    });
  }

  /**
   * 獲取所有測試數據（用於調試）
   */
  getAllTestData() {
    return getAllTestModeData();
  }

  /**
   * 檢查測試模式是否啟用
   */
  isTestModeEnabled(): boolean {
    return TestModeConfig.isEnabled();
  }

  /**
   * 生成測試模式提示訊息
   */
  getTestModeMessage(operation: string): string {
    return `測試模式：${operation}已使用模擬數據。`;
  }

  /**
   * 統一的數據獲取方法
   * 根據數據類型自動選擇實際數據或測試數據
   */
  getData<T>(
    dataType: 'suppliers' | 'customers' | 'products' | 'categories' | 'sales' | 'employees' | 'dashboard' | 'salesTrend' | 'categorySales',
    actualData: T | null,
    actualError: string | null
  ): T {
    switch (dataType) {
      case 'suppliers':
        return this.getSuppliers(actualData as TestSupplierData[] | null, actualError as string | null) as T;
      case 'customers':
        return this.getCustomers(actualData as TestCustomerData[] | null, actualError as string | null) as T;
      case 'products':
        return this.getProducts(actualData as Product[] | null, actualError as string | null) as T;
      case 'categories':
        return this.getCategories(actualData as Category[] | null, actualError as string | null) as T;
      case 'sales':
        return this.getSales(actualData as ExtendedSale[] | null, actualError as string | null) as T;
      case 'employees':
        return this.getEmployees(actualData as TestEmployeeData[] | null, actualError as string | null) as T;
      case 'dashboard':
        return this.getDashboardData(actualData as MockDashboardData | null, actualError as string | null) as T;
      case 'salesTrend':
        return this.getSalesTrend(actualData as SalesTrend[] | null, actualError as string | null) as T;
      case 'categorySales':
        return this.getCategorySales(actualData as CategorySales[] | null, actualError as string | null) as T;
      default:
        return actualData || ([] as T);
    }
  }
}

// 導出單例實例
const testModeDataService = new TestModeDataService();
export default testModeDataService;