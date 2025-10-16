import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import {
  purchaseOrdersContractClient,
} from './client';
import type {
  PurchaseOrderCreateRequest,
  PurchaseOrderUpdateRequest,
  PurchaseOrderListItemDto,
  PurchaseOrderDetailDto,
  PurchaseOrderQueryParams,
} from './dto';

const toContractError = (status: number, body: unknown, fallback: string) => {
  const message =
    typeof body === 'object' && body !== null && 'message' in body
      ? ((body as { message?: string }).message ?? fallback)
      : fallback;

  return {
    status,
    data: message,
  };
};

export const purchaseOrderApi = createApi({
  reducerPath: 'purchaseOrderApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['PurchaseOrder'],
  endpoints: (builder) => ({
    getPurchaseOrders: builder.query<PurchaseOrderListItemDto[], PurchaseOrderQueryParams | undefined>({
      queryFn: async (params) => {
        const hasParams = params && Object.keys(params).length > 0;
        const query = hasParams ? params : undefined;
        const response = await purchaseOrdersContractClient.listPurchaseOrders({ query });

        if (response.status === 200 && response.body?.data) {
          return { data: response.body.data as PurchaseOrderListItemDto[] };
        }

        return {
          error: toContractError(response.status, response.body, 'Failed to load purchase orders'),
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((order) => ({ type: 'PurchaseOrder' as const, id: order._id })),
              { type: 'PurchaseOrder', id: 'LIST' },
            ]
          : [{ type: 'PurchaseOrder', id: 'LIST' }],
    }),
    getPurchaseOrderById: builder.query<PurchaseOrderDetailDto, string>({
      queryFn: async (id) => {
        const response = await purchaseOrdersContractClient.getPurchaseOrderById({ params: { id } });

        if (response.status === 200 && response.body?.data) {
          return { data: response.body.data as PurchaseOrderDetailDto };
        }

        return {
          error: toContractError(response.status, response.body, 'Failed to load purchase order'),
        };
      },
      providesTags: (_result, _error, id) => [{ type: 'PurchaseOrder', id }],
    }),
    createPurchaseOrder: builder.mutation<PurchaseOrderDetailDto, PurchaseOrderCreateRequest>({
      queryFn: async (body) => {
        const response = await purchaseOrdersContractClient.createPurchaseOrder({ body });

        if (response.status === 200 && response.body?.data) {
          return { data: response.body.data as PurchaseOrderDetailDto };
        }

        return {
          error: toContractError(response.status, response.body, 'Failed to create purchase order'),
        };
      },
      invalidatesTags: [{ type: 'PurchaseOrder', id: 'LIST' }],
    }),
    updatePurchaseOrder: builder.mutation<
      PurchaseOrderDetailDto,
      { id: string; data: PurchaseOrderUpdateRequest }
    >({
      queryFn: async ({ id, data }) => {
        const response = await purchaseOrdersContractClient.updatePurchaseOrder({
          params: { id },
          body: data,
        });

        if (response.status === 200 && response.body?.data) {
          return { data: response.body.data as PurchaseOrderDetailDto };
        }

        return {
          error: toContractError(response.status, response.body, 'Failed to update purchase order'),
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'PurchaseOrder', id },
        { type: 'PurchaseOrder', id: 'LIST' },
      ],
    }),
    deletePurchaseOrder: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        const response = await purchaseOrdersContractClient.deletePurchaseOrder({ params: { id } });

        if (response.status === 200) {
          return { data: { id } };
        }

        return {
          error: toContractError(response.status, response.body, 'Failed to delete purchase order'),
        };
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'PurchaseOrder', id },
        { type: 'PurchaseOrder', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
} = purchaseOrderApi;

export default purchaseOrderApi;
