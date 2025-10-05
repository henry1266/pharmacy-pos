import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { productContractClient } from './client';
import type { ProductListEnvelope, ProductQueryParams, ProductResponseDto } from './dto';

type ListProductsArgs = Parameters<typeof productContractClient.listProducts>[0];

const toFetchError = (status: number, body: unknown): FetchBaseQueryError => ({
  status,
  data: body,
});

const toUnknownFetchError = (error: unknown): FetchBaseQueryError => ({
  status: 'FETCH_ERROR',
  data: undefined,
  error: error instanceof Error ? error.message : 'Unknown error',
});

const isSuccessEnvelope = (
  body: unknown,
): body is ProductListEnvelope<ProductResponseDto[] | ProductResponseDto> => (
  typeof body === 'object'
  && body !== null
  && 'success' in body
  && (body as { success?: boolean }).success === true
);

const extractProductList = (body: unknown): ProductResponseDto[] => {
  if (Array.isArray(body)) {
    return body as ProductResponseDto[];
  }

  if (isSuccessEnvelope(body)) {
    const data = body.data;
    if (Array.isArray(data)) {
      return data as ProductResponseDto[];
    }
  }

  return [];
};

const extractProduct = (body: unknown): ProductResponseDto | undefined => {
  if (!body) {
    return undefined;
  }

  if (Array.isArray(body)) {
    return (body[0] ?? undefined) as ProductResponseDto | undefined;
  }

  if (isSuccessEnvelope(body)) {
    if (Array.isArray(body.data)) {
      return (body.data[0] ?? undefined) as ProductResponseDto | undefined;
    }
    return body.data as ProductResponseDto | undefined;
  }

  return body as ProductResponseDto;
};

export const productApi = createApi({
  reducerPath: 'productApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    getProducts: builder.query<ProductResponseDto[], ProductQueryParams | void>({
      queryFn: async (params) => {
        try {
          const normalizedParams = (params ?? {}) as ProductQueryParams;
          const hasParams = Object.keys(normalizedParams).length > 0;
          const queryParams = (hasParams ? normalizedParams : undefined) as ListProductsArgs['query'];
          const requestArgs: ListProductsArgs = { query: queryParams };
          const result = await productContractClient.listProducts(requestArgs);

          if (result.status === 200) {
            return { data: extractProductList(result.body) };
          }

          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      providesTags: (result) => (result && result.length > 0)
        ? [
          ...result.map((product) => ({
            type: 'Product' as const,
            id: (product as ProductResponseDto & { id?: string }).id
              ?? (product as Record<string, string>)._id,
          })),
          { type: 'Product', id: 'LIST' },
        ]
        : [{ type: 'Product', id: 'LIST' }],
    }),
    getProductById: builder.query<ProductResponseDto, string>({
      queryFn: async (id) => {
        try {
          const result = await productContractClient.getProductById({ params: { id } });
          if (result.status === 200) {
            const product = extractProduct(result.body);
            if (product) {
              return { data: product };
            }
          }
          if (result.status === 404) {
            return {
              error: toFetchError(result.status, result.body ?? { message: 'Product not found' }),
            };
          }
          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),
  }),
});

export const { useGetProductsQuery, useGetProductByIdQuery } = productApi;
export default productApi;
