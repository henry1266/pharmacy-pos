import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { shippingOrderApiClient } from './client';
import type {
  ShippingOrderResponseDto,
  ShippingOrderQueryParams,
  ShippingOrderCreateDto,
  ShippingOrderUpdateDto
} from './dto';

export const shippingOrderApi = createApi({
  reducerPath: 'shippingOrderApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['ShippingOrder'],
  endpoints: (builder) => ({
    getShippingOrders: builder.query<ShippingOrderResponseDto[], ShippingOrderQueryParams | void>({
      queryFn: async (params = {}) => {
        try {
          const response = await shippingOrderApiClient.get('/shipping-orders', { params });
          const data = Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
          return { data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (result) => result ? [
        ...result.map(o => ({ type: 'ShippingOrder' as const, id: (o as any)._id || (o as any).id })),
        { type: 'ShippingOrder', id: 'LIST' }
      ] : [{ type: 'ShippingOrder', id: 'LIST' }]
    }),

    getShippingOrderById: builder.query<ShippingOrderResponseDto, string>({
      queryFn: async (id) => {
        try {
          const response = await shippingOrderApiClient.get(`/shipping-orders/${id}`);
          const data = response.data?.data ?? response.data;
          return { data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'ShippingOrder', id }]
    }),

    createShippingOrder: builder.mutation<ShippingOrderResponseDto, ShippingOrderCreateDto>({
      queryFn: async (body) => {
        try {
          const response = await shippingOrderApiClient.post('/shipping-orders', body);
          const data = response.data?.data ?? response.data;
          return { data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: [{ type: 'ShippingOrder', id: 'LIST' }]
    }),

    updateShippingOrder: builder.mutation<ShippingOrderResponseDto, { id: string; data: ShippingOrderUpdateDto }>({
      queryFn: async ({ id, data }) => {
        try {
          const response = await shippingOrderApiClient.put(`/shipping-orders/${id}`, data);
          const payload = response.data?.data ?? response.data;
          return { data: payload };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ShippingOrder', id },
        { type: 'ShippingOrder', id: 'LIST' }
      ]
    }),

    deleteShippingOrder: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        try {
          await shippingOrderApiClient.delete(`/shipping-orders/${id}`);
          return { data: { id } };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'ShippingOrder', id },
        { type: 'ShippingOrder', id: 'LIST' }
      ]
    })
  })
});

export const {
  useGetShippingOrdersQuery,
  useGetShippingOrderByIdQuery,
  useCreateShippingOrderMutation,
  useUpdateShippingOrderMutation,
  useDeleteShippingOrderMutation
} = shippingOrderApi;

export default shippingOrderApi;

