/**
 * Sale API
 * 使用 RTK Query 定義 API 端點
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  SaleResponseDto, 
  SaleRequestDto, 
  SaleQueryParams, 
  PaginatedResponse,
  SaleStatsResponseDto,
  SaleRefundRequestDto,
  SaleRefundResponseDto,
  ApiResponse,
  mapSaleResponseToSaleData,
  SaleDataDto
} from './dto';
import { saleApiClient } from './client';

/**
 * 創建 Sale API
 * 使用 RTK Query 的 createApi 函數
 */
export const saleApi = createApi({
  reducerPath: 'saleApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Sale', 'SaleStats'],
  endpoints: (builder) => ({
    // 獲取銷售列表
    getSales: builder.query<PaginatedResponse<SaleResponseDto>, SaleQueryParams | void>({
      queryFn: async (params = {}) => {
        try {
          const response = await saleApiClient.get('/sales', { params });
          return { data: response.data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (result) => 
        result 
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Sale' as const, id: _id })),
              { type: 'Sale', id: 'LIST' }
            ]
          : [{ type: 'Sale', id: 'LIST' }]
    }),

    // 獲取單個銷售
    getSaleById: builder.query<SaleResponseDto, string>({
      queryFn: async (id) => {
        try {
          const response = await saleApiClient.get(`/sales/${id}`);
          return { data: response.data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Sale', id }]
    }),

    // 獲取單個銷售並轉換為前端格式
    getSaleDataById: builder.query<SaleDataDto, string>({
      queryFn: async (id) => {
        try {
          const response = await saleApiClient.get(`/sales/${id}`);
          const saleData = mapSaleResponseToSaleData(response.data);
          return { data: saleData };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Sale', id }]
    }),

    // 創建銷售
    createSale: builder.mutation<SaleResponseDto, SaleRequestDto>({
      queryFn: async (saleData) => {
        try {
          const response = await saleApiClient.post('/sales', saleData);
          return { data: response.data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: [{ type: 'Sale', id: 'LIST' }, { type: 'SaleStats' }]
    }),

    // 更新銷售
    updateSale: builder.mutation<SaleResponseDto, { id: string; data: SaleRequestDto }>({
      queryFn: async ({ id, data }) => {
        try {
          const response = await saleApiClient.put(`/sales/${id}`, data);
          return { data: response.data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Sale', id },
        { type: 'Sale', id: 'LIST' },
        { type: 'SaleStats' }
      ]
    }),

    // 刪除銷售
    deleteSale: builder.mutation<ApiResponse<{ id: string }>, string>({
      queryFn: async (id) => {
        try {
          const response = await saleApiClient.delete(`/sales/${id}`);
          return { data: response.data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Sale', id },
        { type: 'Sale', id: 'LIST' },
        { type: 'SaleStats' }
      ]
    }),

    // 獲取銷售統計
    getSaleStats: builder.query<SaleStatsResponseDto, { startDate?: string; endDate?: string } | void>({
      queryFn: async (params = {}) => {
        try {
          const response = await saleApiClient.get('/sales/stats', { params });
          return { data: response.data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: [{ type: 'SaleStats' }]
    }),

    // 獲取客戶銷售記錄
    getCustomerSales: builder.query<PaginatedResponse<SaleResponseDto>, { customerId: string; params?: SaleQueryParams }>({
      queryFn: async ({ customerId, params = {} }) => {
        try {
          const response = await saleApiClient.get(`/customers/${customerId}/sales`, { params });
          return { data: response.data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (_result, _error, { customerId }) => [
        { type: 'Sale', id: `customer-${customerId}` },
        { type: 'Sale', id: 'LIST' }
      ]
    }),

    // 獲取今日銷售
    getTodaySales: builder.query<PaginatedResponse<SaleResponseDto>, SaleQueryParams | void>({
      queryFn: async (params = {}) => {
        try {
          const response = await saleApiClient.get('/sales/today', { params });
          return { data: response.data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: [{ type: 'Sale', id: 'TODAY' }, { type: 'Sale', id: 'LIST' }]
    }),

    // 獲取月度銷售
    getMonthlySales: builder.query<PaginatedResponse<SaleResponseDto>, { year: number; month: number; params?: SaleQueryParams }>({
      queryFn: async ({ year, month, params = {} }) => {
        try {
          const response = await saleApiClient.get(`/sales/monthly/${year}/${month}`, { params });
          return { data: response.data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (_result, _error, { year, month }) => [
        { type: 'Sale', id: `monthly-${year}-${month}` },
        { type: 'Sale', id: 'LIST' }
      ]
    }),

    // 處理退款
    processRefund: builder.mutation<SaleRefundResponseDto, SaleRefundRequestDto>({
      queryFn: async (refundData) => {
        try {
          const response = await saleApiClient.post('/sales/refund', refundData);
          return { data: response.data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: (_result, _error, { saleId }) => [
        { type: 'Sale', id: saleId },
        { type: 'Sale', id: 'LIST' },
        { type: 'SaleStats' }
      ]
    })
  })
});

// 導出 hooks
export const {
  useGetSalesQuery,
  useGetSaleByIdQuery,
  useGetSaleDataByIdQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
  useGetSaleStatsQuery,
  useGetCustomerSalesQuery,
  useGetTodaySalesQuery,
  useGetMonthlySalesQuery,
  useProcessRefundMutation
} = saleApi;

// 導出 API
export default saleApi;