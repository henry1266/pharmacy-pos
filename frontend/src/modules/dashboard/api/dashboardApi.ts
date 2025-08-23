/**
 * Dashboard API
 * 使用 RTK Query 定義 API 端點
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  DailyStatsDto,
  DailyStatsQueryParams,
  SalesDashboardDto,
  SalesDashboardQueryParams,
  AccountingDashboardDto,
  AccountingDashboardQueryParams,
  UpdateAccountingRecordDto,
  DashboardStatsDto,
  ApiResponse,
  mapToDailyStatsDto,
  mapToSalesDashboardDto,
  mapToAccountingDashboardDto
} from './dto';
import { dashboardApiClient } from './client';
import { ExtendedAccountingRecord } from '@pharmacy-pos/shared/types/accounting';
import { Sale, PurchaseOrder, ShippingOrder } from '@pharmacy-pos/shared/types/entities';

/**
 * 創建 Dashboard API
 * 使用 RTK Query 的 createApi 函數
 */
export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['DailyStats', 'SalesDashboard', 'AccountingDashboard', 'DashboardStats'],
  endpoints: (builder) => ({
    // 獲取日期統計數據
    getDailyStats: builder.query<DailyStatsDto, DailyStatsQueryParams>({
      queryFn: async (params) => {
        try {
          // 獲取進貨數據
          const purchaseResponse = await dashboardApiClient.get('/purchase-orders', {
            params: {
              startDate: params.date,
              endDate: params.date
            }
          });
          const purchaseRecords: PurchaseOrder[] = purchaseResponse.data || [];
          
          // 獲取出貨數據
          const shippingResponse = await dashboardApiClient.get('/shipping-orders', {
            params: {
              startDate: params.date,
              endDate: params.date
            }
          });
          const shippingRecords: ShippingOrder[] = shippingResponse.data || [];
          
          // 計算統計數據
          const purchaseTotal = purchaseRecords.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
          const shippingTotal = shippingRecords.reduce((sum, order) => {
            return sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.price), 0) || 0);
          }, 0);
          
          // 構建響應數據
          const dailyStats: DailyStatsDto = {
            date: params.date,
            purchaseTotal,
            purchaseCount: purchaseRecords.length,
            purchaseRecords,
            shippingTotal,
            shippingCount: shippingRecords.length,
            shippingRecords
          };
          
          return { data: dailyStats };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (_result, _error, params) => [{ type: 'DailyStats', id: params.date }]
    }),
    
    // 獲取銷售儀表板數據
    getSalesDashboard: builder.query<SalesDashboardDto, SalesDashboardQueryParams>({
      queryFn: async (params) => {
        try {
          const response = await dashboardApiClient.get('/sales', {
            params: {
              startDate: params.startDate,
              endDate: params.endDate,
              search: params.search
            }
          });
          
          const salesRecords: Sale[] = response.data || [];
          const salesTotal = salesRecords.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
          
          const salesDashboard: SalesDashboardDto = {
            salesRecords,
            salesTotal,
            salesCount: salesRecords.length
          };
          
          return { data: salesDashboard };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (_result, _error, params) => [
        { type: 'SalesDashboard', id: `${params.startDate}-${params.endDate}` }
      ]
    }),
    
    // 獲取記帳儀表板數據
    getAccountingDashboard: builder.query<AccountingDashboardDto, AccountingDashboardQueryParams>({
      queryFn: async (params) => {
        try {
          const response = await dashboardApiClient.get('/accounting-records', {
            params: {
              startDate: params.startDate,
              endDate: params.endDate
            }
          });
          
          const accountingRecords: ExtendedAccountingRecord[] = response.data || [];
          const accountingTotal = accountingRecords.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
          
          const accountingDashboard: AccountingDashboardDto = {
            accountingRecords,
            accountingTotal
          };
          
          return { data: accountingDashboard };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (_result, _error, params) => [
        { type: 'AccountingDashboard', id: `${params.startDate}-${params.endDate}` }
      ]
    }),
    
    // 更新記帳記錄
    updateAccountingRecord: builder.mutation<ExtendedAccountingRecord, UpdateAccountingRecordDto>({
      queryFn: async ({ id, data }) => {
        try {
          const response = await dashboardApiClient.put(`/accounting-records/${id}`, data);
          return { data: response.data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: (_result, _error, _arg) => [
        { type: 'AccountingDashboard', id: 'LIST' }
      ]
    }),
    
    // 刪除記帳記錄
    deleteAccountingRecord: builder.mutation<ApiResponse<{ id: string }>, string>({
      queryFn: async (id) => {
        try {
          const response = await dashboardApiClient.delete(`/accounting-records/${id}`);
          return { data: response.data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: (_result, _error, _id) => [
        { type: 'AccountingDashboard', id: 'LIST' }
      ]
    }),
    
    // 獲取儀表板統計數據
    getDashboardStats: builder.query<DashboardStatsDto, void>({
      queryFn: async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          
          // 獲取今日銷售數據
          const salesResponse = await dashboardApiClient.get('/sales', {
            params: {
              startDate: today,
              endDate: today
            }
          });
          const todaySales: Sale[] = salesResponse.data || [];
          const todaySalesTotal = todaySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
          
          // 獲取今日進貨數據
          const purchaseResponse = await dashboardApiClient.get('/purchase-orders', {
            params: {
              startDate: today,
              endDate: today
            }
          });
          const todayPurchases: PurchaseOrder[] = purchaseResponse.data || [];
          const todayPurchaseTotal = todayPurchases.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
          
          // 獲取今日出貨數據
          const shippingResponse = await dashboardApiClient.get('/shipping-orders', {
            params: {
              startDate: today,
              endDate: today
            }
          });
          const todayShippings: ShippingOrder[] = shippingResponse.data || [];
          const todayShippingTotal = todayShippings.reduce((sum, order) => {
            return sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.price), 0) || 0);
          }, 0);
          
          // 獲取今日記帳數據
          const accountingResponse = await dashboardApiClient.get('/accounting-records', {
            params: {
              startDate: today,
              endDate: today
            }
          });
          const todayAccountings: ExtendedAccountingRecord[] = accountingResponse.data || [];
          const todayAccountingTotal = todayAccountings.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
          
          // 獲取本月銷售數據
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth() + 1;
          const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
          const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
          
          const monthlySalesResponse = await dashboardApiClient.get('/sales', {
            params: {
              startDate: firstDay,
              endDate: lastDay
            }
          });
          const monthlySales: Sale[] = monthlySalesResponse.data || [];
          const monthSalesTotal = monthlySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
          
          // 構建響應數據
          const dashboardStats: DashboardStatsDto = {
            todaySalesTotal,
            todaySalesCount: todaySales.length,
            todayPurchaseTotal,
            todayPurchaseCount: todayPurchases.length,
            todayShippingTotal,
            todayShippingCount: todayShippings.length,
            todayAccountingTotal,
            monthSalesTotal,
            monthSalesCount: monthlySales.length
          };
          
          return { data: dashboardStats };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: [{ type: 'DashboardStats' }]
    })
  })
});

// 導出 hooks
export const {
  useGetDailyStatsQuery,
  useGetSalesDashboardQuery,
  useGetAccountingDashboardQuery,
  useUpdateAccountingRecordMutation,
  useDeleteAccountingRecordMutation,
  useGetDashboardStatsQuery
} = dashboardApi;

// 導出 API
export default dashboardApi;