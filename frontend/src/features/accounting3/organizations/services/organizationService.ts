/**
 * Organization Service
 * 組織相關的服務函數
 */

import axios from 'axios';
import {
  Organization,
  OrganizationType,
  OrganizationsResponse,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  OrganizationFilterOptions,
  OrganizationStatistics
} from '../types';

const API_BASE_URL = '/api/organizations';

/**
 * 獲取組織列表
 * @param params 查詢參數
 */
export const getOrganizations = async (
  params?: {
    page?: number;
    limit?: number;
    type?: OrganizationType;
    isActive?: boolean;
    parentId?: string;
    search?: string;
  }
): Promise<OrganizationsResponse> => {
  const response = await axios.get(API_BASE_URL, { params });
  return response.data;
};

/**
 * 獲取單個組織詳情
 * @param id 組織ID
 */
export const getOrganizationById = async (id: string): Promise<Organization> => {
  const response = await axios.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

/**
 * 創建新組織
 * @param data 組織資料
 */
export const createOrganization = async (data: CreateOrganizationRequest): Promise<Organization> => {
  const response = await axios.post(API_BASE_URL, data);
  return response.data;
};

/**
 * 更新組織資料
 * @param id 組織ID
 * @param data 更新的資料
 */
export const updateOrganization = async (
  id: string,
  data: UpdateOrganizationRequest
): Promise<Organization> => {
  const response = await axios.put(`${API_BASE_URL}/${id}`, data);
  return response.data;
};

/**
 * 刪除組織
 * @param id 組織ID
 */
export const deleteOrganization = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/${id}`);
};

/**
 * 獲取組織統計資料
 */
export const getOrganizationStatistics = async (): Promise<OrganizationStatistics> => {
  const response = await axios.get(`${API_BASE_URL}/statistics`);
  return response.data;
};

/**
 * 獲取組織樹狀結構
 */
export const getOrganizationTree = async (): Promise<Organization[]> => {
  const response = await axios.get(`${API_BASE_URL}/tree`);
  return response.data;
};

/**
 * 過濾組織列表
 * @param filter 過濾條件
 */
export const filterOrganizationList = async (
  filter: OrganizationFilterOptions
): Promise<Organization[]> => {
  const response = await axios.get(`${API_BASE_URL}/filter`, { params: filter });
  return response.data;
};

/**
 * 檢查組織代碼是否可用
 * @param code 組織代碼
 */
export const checkOrganizationCodeAvailability = async (code: string): Promise<boolean> => {
  const response = await axios.get(`${API_BASE_URL}/check-code/${code}`);
  return response.data.available;
};

/**
 * 啟用/停用組織
 * @param id 組織ID
 * @param isActive 是否啟用
 */
export const toggleOrganizationStatus = async (
  id: string,
  isActive: boolean
): Promise<Organization> => {
  const response = await axios.patch(`${API_BASE_URL}/${id}/status`, { isActive });
  return response.data;
};