import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { customerApiClient } from './client';
import type { CustomerRequestDto, CustomerResponseDto, CustomerQueryParams } from './dto';

export const customerApi = createApi({
  reducerPath: 'customerApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Customer'],
  endpoints: (builder) => ({
    getCustomers: builder.query<CustomerResponseDto[], CustomerQueryParams | void>({
      queryFn: async (params = {}) => {
        try {
          const response = await customerApiClient.get('/customers', { params });
          const payload = Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
          return { data: payload };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (result) => result ? [
        ...result.map(c => ({ type: 'Customer' as const, id: (c as any)._id || (c as any).id })),
        { type: 'Customer', id: 'LIST' }
      ] : [{ type: 'Customer', id: 'LIST' }]
    }),
    getCustomerById: builder.query<CustomerResponseDto, string>({
      queryFn: async (id) => {
        try {
          const response = await customerApiClient.get(`/customers/${id}`);
          const data = response.data?.data ?? response.data;
          return { data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Customer', id }]
    }),
    createCustomer: builder.mutation<CustomerResponseDto, CustomerRequestDto>({
      queryFn: async (body) => {
        try {
          const response = await customerApiClient.post('/customers', body);
          const data = response.data?.data ?? response.data;
          return { data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }]
    }),
    updateCustomer: builder.mutation<CustomerResponseDto, { id: string; data: CustomerRequestDto }>({
      queryFn: async ({ id, data }) => {
        try {
          const response = await customerApiClient.put(`/customers/${id}`, data);
          const payload = response.data?.data ?? response.data;
          return { data: payload };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Customer', id },
        { type: 'Customer', id: 'LIST' }
      ]
    }),
    deleteCustomer: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        try {
          await customerApiClient.delete(`/customers/${id}`);
          return { data: { id } };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Customer', id },
        { type: 'Customer', id: 'LIST' }
      ]
    })
  })
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation
} = customerApi;

export default customerApi;

