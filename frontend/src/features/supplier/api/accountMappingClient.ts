import {
  createSupplierAccountMappingsContractClient,
  type SupplierAccountMappingsContractClient,
  type SupplierAccountMappingsClientOptions,
  type SupplierAccountMappingsHeaderShape,
} from '@pharmacy-pos/shared';
import { withAuthHeader } from './client';

const applyAuthHeader = (
  baseHeaders: SupplierAccountMappingsHeaderShape = {},
): SupplierAccountMappingsHeaderShape =>
  withAuthHeader<SupplierAccountMappingsHeaderShape>(baseHeaders);

export const createSupplierAccountMappingClient = (
  options: SupplierAccountMappingsClientOptions = {},
): SupplierAccountMappingsContractClient => {
  const {
    baseHeaders,
    baseUrl = '/api',
    throwOnUnknownStatus = true,
  } = options;

  return createSupplierAccountMappingsContractClient({
    baseUrl,
    throwOnUnknownStatus,
    baseHeaders: applyAuthHeader(baseHeaders),
  });
};

export const supplierAccountMappingClient = createSupplierAccountMappingClient();

export default supplierAccountMappingClient;
