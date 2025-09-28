import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { purchaseOrderApiClient } from './client';
import type {
  PurchaseOrderCreateRequest,
  PurchaseOrderUpdateRequest,
  PurchaseOrderResponseDto,
  PurchaseOrderQueryParams
} from './dto';

const toQueryError = (error: any) => ({
  status: error?.status ?? 500,
  data: error?.message ?? 'Request failed'
});

export const purchaseOrderApi = createApi({
  reducerPath: 'purchaseOrderApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['PurchaseOrder'],
  endpoints: (builder) => ({
    getPurchaseOrders: builder.query<PurchaseOrderResponseDto[], PurchaseOrderQueryParams | void>({
      queryFn: async (params = {}) => {
        try {
          const response = await purchaseOrderApiClient.get('', { params });
          const payload = Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
          return { data: payload };
        } catch (error: any) {
          return { error: toQueryError(error) };
        }
      },
      providesTags: (result) => result
        ? [
            ...result.map((order) => ({ type: 'PurchaseOrder' as const, id: order._id })),
            { type: 'PurchaseOrder', id: 'LIST' }
          ]
        : [{ type: 'PurchaseOrder', id: 'LIST' }]
    }),
    getPurchaseOrderById: builder.query<PurchaseOrderResponseDto, string>({
      queryFn: async (id) => {
        try {
          const response = await purchaseOrderApiClient.get(`/${id}`);
          const data = response.data?.data ?? response.data;
          return { data };
        } catch (error: any) {
          return { error: toQueryError(error) };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'PurchaseOrder', id }]
    }),
    createPurchaseOrder: builder.mutation<PurchaseOrderResponseDto, PurchaseOrderCreateRequest>({
      queryFn: async (body) => {
        try {
          const response = await purchaseOrderApiClient.post('', body);
          const data = response.data?.data ?? response.data;
          return { data };
        } catch (error: any) {
          return { error: toQueryError(error) };
        }
      },
      invalidatesTags: [{ type: 'PurchaseOrder', id: 'LIST' }]
    }),
    updatePurchaseOrder: builder.mutation<PurchaseOrderResponseDto, { id: string; data: PurchaseOrderUpdateRequest }>({
      queryFn: async ({ id, data }) => {
        try {
          const response = await purchaseOrderApiClient.put(`/${id}`, data);
          const payload = response.data?.data ?? response.data;
          return { data: payload };
        } catch (error: any) {
          return { error: toQueryError(error) };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'PurchaseOrder', id },
        { type: 'PurchaseOrder', id: 'LIST' }
      ]
    }),
    deletePurchaseOrder: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        try {
          await purchaseOrderApiClient.delete(`/${id}`);
          return { data: { id } };
        } catch (error: any) {
          return { error: toQueryError(error) };
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'PurchaseOrder', id },
        { type: 'PurchaseOrder', id: 'LIST' }
      ]
    })
  })
});

export const {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation
} = purchaseOrderApi;

export default purchaseOrderApi;
