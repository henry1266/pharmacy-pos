import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { customerContractClient } from './client';
import type {
  CustomerCreateRequest,
  CustomerUpdateRequest,
  CustomerResponseDto,
  CustomerQueryParams,
} from './dto';

type ListCustomersArgs = Parameters<typeof customerContractClient.listCustomers>[0];

const toFetchError = (status: number, body: unknown): FetchBaseQueryError => ({
  status,
  data: body,
});

const toUnknownFetchError = (error: unknown): FetchBaseQueryError => ({
  status: 'FETCH_ERROR',
  data: undefined,
  error: error instanceof Error ? error.message : 'Unknown error',
});

export const customerApi = createApi({
  reducerPath: 'customerApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Customer'],
  endpoints: (builder) => ({
    getCustomers: builder.query<CustomerResponseDto[], CustomerQueryParams | void>({
      queryFn: async (params) => {
        try {
          const queryParams = params ?? undefined;
          const requestArgs: ListCustomersArgs = { query: queryParams };

          const result = await customerContractClient.listCustomers(requestArgs);
          if (result.status === 200 && result.body?.success) {
            const payload = (result.body.data ?? []) as CustomerResponseDto[];
            return { data: payload };
          }

          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      providesTags: (result) => (result && result.length > 0)
        ? [
          ...result.map((customer) => {
            const fallbackId = (customer as CustomerResponseDto & { id?: string }).id;
            return { type: 'Customer' as const, id: fallbackId ?? customer._id };
          }),
          { type: 'Customer', id: 'LIST' },
        ]
        : [{ type: 'Customer', id: 'LIST' }],
    }),
    getCustomerById: builder.query<CustomerResponseDto, string>({
      queryFn: async (id) => {
        try {
          const result = await customerContractClient.getCustomerById({ params: { id } });
          if (result.status === 200 && result.body?.success) {
            const data = (result.body.data ?? {}) as CustomerResponseDto;
            return { data };
          }

          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Customer', id }],
    }),
    createCustomer: builder.mutation<CustomerResponseDto, CustomerCreateRequest>({
      queryFn: async (body) => {
        try {
          const result = await customerContractClient.createCustomer({ body });
          if (result.status === 200 && result.body?.success) {
            const data = (result.body.data ?? {}) as CustomerResponseDto;
            return { data };
          }

          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),
    updateCustomer: builder.mutation<CustomerResponseDto, { id: string; data: CustomerUpdateRequest }>({
      queryFn: async ({ id, data }) => {
        try {
          const result = await customerContractClient.updateCustomer({ params: { id }, body: data });
          if (result.status === 200 && result.body?.success) {
            const payload = (result.body.data ?? {}) as CustomerResponseDto;
            return { data: payload };
          }

          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Customer', id },
        { type: 'Customer', id: 'LIST' },
      ],
    }),
    deleteCustomer: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        try {
          const result = await customerContractClient.deleteCustomer({ params: { id } });
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
        { type: 'Customer', id },
        { type: 'Customer', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApi;

export default customerApi;

