import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { supplierContractClient } from './client';
import type {
  SupplierCreateRequest,
  SupplierUpdateRequest,
  SupplierResponseDto,
  SupplierQueryParams,
} from './dto';

type ListSuppliersArgs = Parameters<typeof supplierContractClient.listSuppliers>[0];

const toFetchError = (status: number, body: unknown): FetchBaseQueryError => ({
  status,
  data: body,
});

const toUnknownFetchError = (error: unknown): FetchBaseQueryError => ({
  status: 'FETCH_ERROR',
  data: undefined,
  error: error instanceof Error ? error.message : 'Unknown error',
});

export const supplierApi = createApi({
  reducerPath: 'supplierApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Supplier'],
  endpoints: (builder) => ({
    getSuppliers: builder.query<SupplierResponseDto[], SupplierQueryParams | void>({
      queryFn: async (params) => {
        try {
          const queryParams = (params ?? undefined) as ListSuppliersArgs['query'];
          const requestArgs: ListSuppliersArgs = { query: queryParams };
          const result = await supplierContractClient.listSuppliers(requestArgs);
          if (result.status === 200 && result.body?.success) {
            const payload = (result.body.data ?? []) as SupplierResponseDto[];
            return { data: payload };
          }
          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      providesTags: (result) => (result && result.length > 0)
        ? [
          ...result.map((supplier) => ({
            type: 'Supplier' as const,
            id: (supplier as SupplierResponseDto & { id?: string }).id ?? (supplier as any)._id,
          })),
          { type: 'Supplier', id: 'LIST' },
        ]
        : [{ type: 'Supplier', id: 'LIST' }],
    }),
    getSupplierById: builder.query<SupplierResponseDto, string>({
      queryFn: async (id) => {
        try {
          const result = await supplierContractClient.getSupplierById({ params: { id } });
          if (result.status === 200 && result.body?.success) {
            const data = (result.body.data ?? {}) as SupplierResponseDto;
            return { data };
          }
          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Supplier', id }],
    }),
    createSupplier: builder.mutation<SupplierResponseDto, SupplierCreateRequest>({
      queryFn: async (body) => {
        try {
          const result = await supplierContractClient.createSupplier({ body });
          if (result.status === 200 && result.body?.success) {
            const data = (result.body.data ?? {}) as SupplierResponseDto;
            return { data };
          }
          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      invalidatesTags: [{ type: 'Supplier', id: 'LIST' }],
    }),
    updateSupplier: builder.mutation<SupplierResponseDto, { id: string; data: SupplierUpdateRequest }>({
      queryFn: async ({ id, data }) => {
        try {
          const result = await supplierContractClient.updateSupplier({ params: { id }, body: data });
          if (result.status === 200 && result.body?.success) {
            const payload = (result.body.data ?? {}) as SupplierResponseDto;
            return { data: payload };
          }
          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Supplier', id },
        { type: 'Supplier', id: 'LIST' },
      ],
    }),
    deleteSupplier: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        try {
          const result = await supplierContractClient.deleteSupplier({ params: { id } });
          if (result.status === 200 && result.body?.success) {
            const deletedId = (result.body.data as { id?: string } | undefined)?.id ?? id;
            return { data: { id: deletedId } };
          }
          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Supplier', id },
        { type: 'Supplier', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = supplierApi;

export default supplierApi;
