import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { salesContractClient } from './client';
import type {
  SaleResponseDto,
  SaleCreateRequest,
  SaleQueryParams,
  ApiResponse,
  SaleDataDto,
} from './dto';
import { mapSaleResponseToSaleData } from './dto';

type ListSalesArgs = Parameters<typeof salesContractClient.listSales>[0];
type GetSaleByIdArgs = Parameters<typeof salesContractClient.getSaleById>[0];
type CreateSaleArgs = Parameters<typeof salesContractClient.createSale>[0];
type UpdateSaleArgs = Parameters<typeof salesContractClient.updateSale>[0];
type DeleteSaleArgs = Parameters<typeof salesContractClient.deleteSale>[0];
type GetTodaySalesArgs = Parameters<typeof salesContractClient.getTodaySales>[0];

type SuccessEnvelope<T> = {
  success: true;
  data?: T;
  message?: string;
};

const toFetchError = (status: number, body: unknown): FetchBaseQueryError => ({
  status,
  data: body,
});

const toUnknownFetchError = (error: unknown): FetchBaseQueryError => ({
  status: 'FETCH_ERROR',
  data: undefined,
  error: error instanceof Error ? error.message : 'Unknown error',
});

const isSuccessEnvelope = <T>(body: unknown): body is SuccessEnvelope<T> => (
  typeof body === 'object'
  && body !== null
  && 'success' in body
  && (body as { success?: boolean }).success === true
);

const extractSalesList = (body: unknown): SaleResponseDto[] => {
  if (Array.isArray(body)) {
    return body as SaleResponseDto[];
  }

  if (isSuccessEnvelope<SaleResponseDto[] | SaleResponseDto>(body)) {
    const data = body.data;
    if (Array.isArray(data)) {
      return data as SaleResponseDto[];
    }
    if (data) {
      return [data as SaleResponseDto];
    }
  }

  return [];
};

const extractSale = (body: unknown): SaleResponseDto | undefined => {
  if (!body) {
    return undefined;
  }

  if (Array.isArray(body)) {
    return (body[0] ?? undefined) as SaleResponseDto | undefined;
  }

  if (isSuccessEnvelope<SaleResponseDto>(body)) {
    if (Array.isArray(body.data)) {
      return (body.data[0] ?? undefined) as SaleResponseDto | undefined;
    }
    return body.data as SaleResponseDto | undefined;
  }

  return body as SaleResponseDto;
};

const buildListSalesArgs = (params?: SaleQueryParams | void): ListSalesArgs => {
  const normalized = params ?? undefined;
  if (normalized && Object.keys(normalized).length > 0) {
    return { query: normalized } as ListSalesArgs;
  }
  return {} as ListSalesArgs;
};

export const saleApi = createApi({
  reducerPath: 'saleApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Sale'],
  endpoints: (builder) => ({
    getSales: builder.query<SaleResponseDto[], SaleQueryParams | void>({
      queryFn: async (params = {}) => {
        try {
          const args = buildListSalesArgs(params);
          const result = await salesContractClient.listSales(args);

          if (result.status === 200) {
            return { data: extractSalesList(result.body) };
          }

          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      providesTags: (result) => (result && result.length > 0)
        ? [
          ...result.map((sale) => ({
            type: 'Sale' as const,
            id: (sale as SaleResponseDto & { id?: string }).id ?? sale._id,
          })),
          { type: 'Sale', id: 'LIST' },
        ]
        : [{ type: 'Sale', id: 'LIST' }],
    }),

    getSaleById: builder.query<SaleResponseDto, string>({
      queryFn: async (id) => {
        try {
          const result = await salesContractClient.getSaleById({
            params: { id },
          } as GetSaleByIdArgs);

          if (result.status === 200) {
            const sale = extractSale(result.body);
            if (sale) {
              return { data: sale };
            }
          }

          if (result.status === 404) {
            return {
              error: toFetchError(result.status, result.body ?? { message: 'Sale not found' }),
            };
          }

          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Sale', id }],
    }),

    getSaleDataById: builder.query<SaleDataDto, string>({
      queryFn: async (id) => {
        try {
          const result = await salesContractClient.getSaleById({
            params: { id },
          } as GetSaleByIdArgs);

          if (result.status === 200) {
            const sale = extractSale(result.body);
            if (sale) {
              return { data: mapSaleResponseToSaleData(sale) };
            }
          }

          if (result.status === 404) {
            return {
              error: toFetchError(result.status, result.body ?? { message: 'Sale not found' }),
            };
          }

          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Sale', id }],
    }),

    createSale: builder.mutation<SaleResponseDto, SaleCreateRequest>({
      queryFn: async (payload) => {
        try {
          const result = await salesContractClient.createSale({
            body: payload,
          } as CreateSaleArgs);

          if (result.status === 200) {
            const sale = extractSale(result.body);
            if (sale) {
              return { data: sale };
            }
          }

          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      invalidatesTags: [{ type: 'Sale', id: 'LIST' }],
    }),

    updateSale: builder.mutation<SaleResponseDto, { id: string; data: SaleCreateRequest }>({
      queryFn: async ({ id, data }) => {
        try {
          const result = await salesContractClient.updateSale({
            params: { id },
            body: data,
          } as UpdateSaleArgs);

          if (result.status === 200) {
            const sale = extractSale(result.body);
            if (sale) {
              return { data: sale };
            }
          }

          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Sale', id },
        { type: 'Sale', id: 'LIST' },
      ],
    }),

    deleteSale: builder.mutation<ApiResponse<{ id: string }>, string>({
      queryFn: async (id) => {
        try {
          const result = await salesContractClient.deleteSale({
            params: { id },
          } as DeleteSaleArgs);

          if (result.status === 200 && isSuccessEnvelope<{ id?: string }>(result.body)) {
            const payloadId = result.body.data?.id ?? id;
            return {
              data: {
                success: true,
                data: { id: payloadId },
                message: result.body.message ?? 'Sale deleted',
              },
            };
          }

          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Sale', id },
        { type: 'Sale', id: 'LIST' },
      ],
    }),

    getTodaySales: builder.query<SaleResponseDto[], void>({
      queryFn: async () => {
        try {
          const result = await salesContractClient.getTodaySales(
            undefined as GetTodaySalesArgs,
          );

          if (result.status === 200) {
            return { data: extractSalesList(result.body) };
          }

          return { error: toFetchError(result.status, result.body) };
        } catch (error) {
          return { error: toUnknownFetchError(error) };
        }
      },
      providesTags: [{ type: 'Sale', id: 'TODAY' }],
    }),
  }),
});

export const {
  useGetSalesQuery,
  useGetSaleByIdQuery,
  useGetSaleDataByIdQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
  useGetTodaySalesQuery,
} = saleApi;

export default saleApi;
