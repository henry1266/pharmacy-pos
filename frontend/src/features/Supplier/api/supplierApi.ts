/**
 * Supplier API with RTK Query
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { supplierApiClient } from './client';
import type { SupplierCreateRequest, SupplierUpdateRequest, SupplierResponseDto, SupplierQueryParams } from './dto';

export const supplierApi = createApi({
  reducerPath: 'supplierApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Supplier'],
  endpoints: (builder) => ({
    // 供應商清單（回傳陣列，與 service v2 對齊）
    getSuppliers: builder.query<SupplierResponseDto[], SupplierQueryParams | void>({
      queryFn: async (params = {}) => {
        try {
          const response = await supplierApiClient.get('/suppliers', { params });
          // 後端回傳可能為陣列或包在 data 中，兩者皆處理
          const payload = Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
          return { data: payload };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (result) =>
        result ? [
          ...result.map((s) => ({ type: 'Supplier' as const, id: (s as any)._id || (s as any).id })),
          { type: 'Supplier', id: 'LIST' }
        ] : [{ type: 'Supplier', id: 'LIST' }]
    }),

    // 取得單一供應商
    getSupplierById: builder.query<SupplierResponseDto, string>({
      queryFn: async (id) => {
        try {
          const response = await supplierApiClient.get(`/suppliers/${id}`);
          const data = response.data?.data ?? response.data;
          return { data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Supplier', id }]
    }),

    // 建立
    createSupplier: builder.mutation<SupplierResponseDto, SupplierCreateRequest>({
      queryFn: async (body) => {
        try {
          const response = await supplierApiClient.post('/suppliers', body);
          const data = response.data?.data ?? response.data;
          return { data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: [{ type: 'Supplier', id: 'LIST' }]
    }),

    // 更新
    updateSupplier: builder.mutation<SupplierResponseDto, { id: string; data: SupplierUpdateRequest }>({
      queryFn: async ({ id, data }) => {
        try {
          const response = await supplierApiClient.put(`/suppliers/${id}`, data);
          const payload = response.data?.data ?? response.data;
          return { data: payload };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Supplier', id },
        { type: 'Supplier', id: 'LIST' }
      ]
    }),

    // 刪除
    deleteSupplier: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        try {
          await supplierApiClient.delete(`/suppliers/${id}`);
          return { data: { id } };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Supplier', id },
        { type: 'Supplier', id: 'LIST' }
      ]
    })
  })
});

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation
} = supplierApi;

export default supplierApi;


