import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { productApiClient } from './client';
import type { ProductResponseDto, ProductQueryParams } from './dto';

export const productApi = createApi({
  reducerPath: 'productApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    getProducts: builder.query<ProductResponseDto[], ProductQueryParams | void>({
      queryFn: async (params = {}) => {
        try {
          const response = await productApiClient.get('/products', { params });
          const data = Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
          return { data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (result) => result ? [
        ...result.map(p => ({ type: 'Product' as const, id: (p as any)._id || (p as any).id })),
        { type: 'Product', id: 'LIST' }
      ] : [{ type: 'Product', id: 'LIST' }]
    }),
    getProductById: builder.query<ProductResponseDto, string>({
      queryFn: async (id) => {
        try {
          const response = await productApiClient.get(`/products/${id}`);
          const data = response.data?.data ?? response.data;
          return { data };
        } catch (error: any) {
          return { error: { status: error.status, data: error.message } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Product', id }]
    })
  })
});

export const { useGetProductsQuery, useGetProductByIdQuery } = productApi;
export default productApi;

