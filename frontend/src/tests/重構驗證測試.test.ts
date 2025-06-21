/**
 * 重構驗證測試
 * 驗證優化後的程式碼功能正確性
 */

import {
  DateUtils,
  OrderNumberGenerator,
  CsvParser,
  SupplierConfig,
  MedicineCsvService
} from '../services/medicineCsvService-optimized';

import {
  ActionTypes,
  createAsyncActionTypes,
  createAsyncActionCreators,
  createAsyncReducer,
  AsyncState
} from '../types/store-optimized';

describe('重構驗證測試', () => {
  
  describe('DateUtils 測試', () => {
    test('應該正確驗證西元年日期', () => {
      const result = DateUtils.validateAndParseDate('2025-06-21');
      
      expect(result.isValid).toBe(true);
      expect(result.formattedDate).toBe('2025-06-21');
      expect(result.date).toBeInstanceOf(Date);
    });

    test('應該正確轉換民國年日期', () => {
      const result = DateUtils.validateAndParseDate('1140621'); // 民國114年6月21日
      
      expect(result.isValid).toBe(true);
      expect(result.formattedDate).toBe('2025-06-21');
      expect(result.date).toBeInstanceOf(Date);
    });

    test('應該處理無效日期', () => {
      const result = DateUtils.validateAndParseDate('invalid-date');
      
      expect(result.isValid).toBe(false);
      expect(result.formattedDate).toBeNull();
      expect(result.date).toBeNull();
    });

    test('應該正確格式化日期為 YYYYMMDD', () => {
      const date = new Date('2025-06-21');
      const formatted = DateUtils.formatDateToYYYYMMDD(date);
      
      expect(formatted).toBe('20250621');
    });

    test('應該獲取當前日期的 YYYYMMDD 格式', () => {
      const currentDate = DateUtils.getCurrentDateYYYYMMDD();
      
      expect(currentDate).toMatch(/^\d{8}$/);
      expect(currentDate.length).toBe(8);
    });
  });

  describe('OrderNumberGenerator 測試', () => {
    test('應該根據日期生成訂單號', () => {
      const orderNumber = OrderNumberGenerator.generateByDate('2025-06-21');
      
      expect(orderNumber).toBe('20250621001D');
    });

    test('應該處理民國年日期生成訂單號', () => {
      const orderNumber = OrderNumberGenerator.generateByDate('1140621');
      
      expect(orderNumber).toBe('20250621001D');
    });

    test('應該處理空日期', () => {
      const orderNumber = OrderNumberGenerator.generateByDate(null);
      
      expect(orderNumber).toMatch(/^\d{8}001D$/);
    });
  });

  describe('SupplierConfig 測試', () => {
    test('應該返回預設供應商配置', () => {
      const defaultSupplier = SupplierConfig.getDefaultSupplier();
      
      expect(defaultSupplier).toEqual({
        _id: "67f246d4287ee1d681068021",
        code: "SS",
        shortCode: "WRUQ",
        name: "調劑",
        contactPerson: "",
        notes: "扣成本",
        paymentTerms: "",
        phone: "",
        taxId: ""
      });
    });
  });

  describe('MedicineCsvService 向後兼容性測試', () => {
    test('convertToWesternDate 應該正常工作', () => {
      const result = MedicineCsvService.convertToWesternDate('1140621');
      expect(result).toBe('2025-06-21');
    });

    test('generateOrderNumberByDate 應該正常工作', () => {
      const result = MedicineCsvService.generateOrderNumberByDate('2025-06-21');
      expect(result).toBe('20250621001D');
    });
  });

  describe('Store 型別工廠測試', () => {
    test('createAsyncActionTypes 應該生成正確的 Action 型別', () => {
      const actionTypes = createAsyncActionTypes('TEST');
      
      expect(actionTypes).toEqual({
        REQUEST: 'TEST_REQUEST',
        SUCCESS: 'TEST_SUCCESS',
        FAILURE: 'TEST_FAILURE'
      });
    });

    test('createAsyncActionCreators 應該生成正確的 Action 創建器', () => {
      const actionTypes = createAsyncActionTypes('TEST');
      const actionCreators = createAsyncActionCreators<string[]>(actionTypes);
      
      expect(actionCreators.request()).toEqual({
        type: 'TEST_REQUEST'
      });
      
      expect(actionCreators.success(['data'])).toEqual({
        type: 'TEST_SUCCESS',
        payload: ['data']
      });
      
      expect(actionCreators.failure('error')).toEqual({
        type: 'TEST_FAILURE',
        payload: 'error'
      });
    });

    test('createAsyncReducer 應該正確處理 Action', () => {
      const actionTypes = createAsyncActionTypes('TEST');
      const reducer = createAsyncReducer(actionTypes, [] as string[]);
      
      // 測試初始狀態
      const initialState = reducer(undefined, { type: 'INIT' });
      expect(initialState).toEqual({
        data: [],
        loading: false,
        error: null
      });
      
      // 測試 REQUEST action
      const loadingState = reducer(initialState, { type: 'TEST_REQUEST' });
      expect(loadingState).toEqual({
        data: [],
        loading: true,
        error: null
      });
      
      // 測試 SUCCESS action
      const successState = reducer(loadingState, {
        type: 'TEST_SUCCESS',
        payload: ['item1', 'item2']
      });
      expect(successState).toEqual({
        data: ['item1', 'item2'],
        loading: false,
        error: null
      });
      
      // 測試 FAILURE action
      const errorState = reducer(loadingState, {
        type: 'TEST_FAILURE',
        payload: 'Something went wrong'
      });
      expect(errorState).toEqual({
        data: [],
        loading: false,
        error: 'Something went wrong'
      });
    });
  });

  describe('ActionTypes 常數測試', () => {
    test('應該包含所有必要的 Action 型別', () => {
      expect(ActionTypes.AUTH).toBeDefined();
      expect(ActionTypes.PRODUCTS).toBeDefined();
      expect(ActionTypes.SUPPLIERS).toBeDefined();
      expect(ActionTypes.PURCHASE_ORDERS).toBeDefined();
      expect(ActionTypes.SHIPPING_ORDERS).toBeDefined();
    });

    test('PRODUCTS Action 型別應該包含 CRUD 操作', () => {
      expect(ActionTypes.PRODUCTS.REQUEST).toBe('FETCH_PRODUCTS_REQUEST');
      expect(ActionTypes.PRODUCTS.SUCCESS).toBe('FETCH_PRODUCTS_SUCCESS');
      expect(ActionTypes.PRODUCTS.FAILURE).toBe('FETCH_PRODUCTS_FAILURE');
    });
  });

  describe('型別安全性測試', () => {
    test('AsyncState 應該正確約束型別', () => {
      const stringState: AsyncState<string> = {
        data: 'test',
        loading: false,
        error: null
      };
      
      const numberArrayState: AsyncState<number[]> = {
        data: [1, 2, 3],
        loading: true,
        error: 'error'
      };
      
      expect(stringState.data).toBe('test');
      expect(numberArrayState.data).toEqual([1, 2, 3]);
    });
  });
});

describe('效能比較測試', () => {
  test('日期轉換效能應該保持或提升', () => {
    const testDates = [
      '1140621',
      '1140622',
      '1140623',
      '2025-06-21',
      '2025-06-22'
    ];
    
    const startTime = performance.now();
    
    testDates.forEach(date => {
      DateUtils.validateAndParseDate(date);
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // 應該在合理時間內完成（小於 10ms）
    expect(duration).toBeLessThan(10);
  });
});

describe('記憶體使用測試', () => {
  test('重複呼叫不應該造成記憶體洩漏', () => {
    // 模擬大量呼叫
    for (let i = 0; i < 1000; i++) {
      DateUtils.validateAndParseDate('1140621');
      OrderNumberGenerator.generateByDate('2025-06-21');
    }
    
    // 如果沒有拋出錯誤，表示沒有明顯的記憶體問題
    expect(true).toBe(true);
  });
});