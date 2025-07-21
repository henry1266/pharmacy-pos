import { useState, useEffect, useCallback, useMemo } from 'react';
import { Package, PackageFilters, PackageStats } from '../../../shared/types/package';
import { PackageService } from '../services/packageService';

export interface UsePackageDataReturn {
  // 資料狀態
  packages: Package[];
  filteredPackages: Package[];
  loading: boolean;
  error: string | null;
  stats: PackageStats | null;
  categories: string[];
  tags: string[];

  // 篩選狀態
  filters: PackageFilters;
  searchTerm: string;

  // 操作方法
  setFilters: (filters: PackageFilters) => void;
  setSearchTerm: (term: string) => void;
  refreshPackages: () => Promise<void>;
  createPackage: (packageData: any) => Promise<Package>;
  updatePackage: (id: string, packageData: any) => Promise<Package>;
  deletePackage: (id: string) => Promise<void>;
  togglePackageActive: (id: string) => Promise<void>;

  // 輔助方法
  getPackageById: (id: string) => Package | undefined;
  clearError: () => void;
}

export const usePackageData = (): UsePackageDataReturn => {
  // 基本狀態
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PackageStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // 篩選狀態
  const [filters, setFilters] = useState<PackageFilters>({});
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 載入套餐資料
  const loadPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [packagesData, statsData, categoriesData, tagsData] = await Promise.all([
        PackageService.getAllPackages(filters),
        PackageService.getPackageStats().catch(() => null),
        PackageService.getPackageCategories().catch(() => []),
        PackageService.getPackageTags().catch(() => [])
      ]);

      setPackages(packagesData);
      setStats(statsData);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入套餐資料失敗';
      setError(errorMessage);
      console.error('載入套餐資料錯誤:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // 初始載入和篩選變更時重新載入
  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  // 本地篩選套餐（基於搜尋詞）
  const filteredPackages = useMemo(() => {
    if (!searchTerm.trim()) {
      return packages;
    }
    return PackageService.filterPackagesLocally(packages, searchTerm);
  }, [packages, searchTerm]);

  // 重新整理套餐資料
  const refreshPackages = useCallback(async () => {
    await loadPackages();
  }, [loadPackages]);

  // 建立套餐
  const createPackage = useCallback(async (packageData: any): Promise<Package> => {
    try {
      setError(null);
      
      // 驗證資料
      const validationErrors = PackageService.validatePackageData(packageData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const newPackage = await PackageService.createPackage(packageData);
      
      // 更新本地狀態
      setPackages(prev => [newPackage, ...prev]);
      
      return newPackage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '建立套餐失敗';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // 更新套餐
  const updatePackage = useCallback(async (id: string, packageData: any): Promise<Package> => {
    try {
      setError(null);
      
      // 驗證資料
      const validationErrors = PackageService.validatePackageData(packageData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const updatedPackage = await PackageService.updatePackage(id, { ...packageData, id });
      
      // 更新本地狀態
      setPackages(prev => 
        prev.map(pkg => pkg.id === id ? updatedPackage : pkg)
      );
      
      return updatedPackage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新套餐失敗';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // 刪除套餐
  const deletePackage = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await PackageService.deletePackage(id);
      
      // 更新本地狀態
      setPackages(prev => prev.filter(pkg => pkg.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刪除套餐失敗';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // 切換套餐啟用狀態
  const togglePackageActive = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      const updatedPackage = await PackageService.togglePackageActive(id);
      
      // 更新本地狀態
      setPackages(prev => 
        prev.map(pkg => pkg.id === id ? updatedPackage : pkg)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '切換套餐狀態失敗';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // 根據 ID 獲取套餐
  const getPackageById = useCallback((id: string): Package | undefined => {
    return packages.find(pkg => pkg.id === id || pkg._id === id);
  }, [packages]);

  // 清除錯誤
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // 資料狀態
    packages,
    filteredPackages,
    loading,
    error,
    stats,
    categories,
    tags,

    // 篩選狀態
    filters,
    searchTerm,

    // 操作方法
    setFilters,
    setSearchTerm,
    refreshPackages,
    createPackage,
    updatePackage,
    deletePackage,
    togglePackageActive,

    // 輔助方法
    getPackageById,
    clearError
  };
};

export default usePackageData;