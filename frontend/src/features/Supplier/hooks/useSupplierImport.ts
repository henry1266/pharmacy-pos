import { useState } from 'react';
import { ImportResult } from '../types/supplier.types';
import useSupplierData from '../../../hooks/useSupplierData';

export const useSupplierImport = (isTestMode: boolean) => {
  const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [templateDownloading, setTemplateDownloading] = useState<boolean>(false);

  const { importCsv: actualImportCsv, downloadTemplate: actualDownloadTemplate } = useSupplierData();

  const handleCloseImportDialog = (): void => {
    setOpenImportDialog(false);
    setCsvFile(null);
    setImportResult(null);
  };

  const handleOpenImportDialog = (): void => {
    setOpenImportDialog(true);
    setImportResult(null);
    setCsvFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
        setCsvFile(file);
        setImportResult(null);
      } else {
        alert('請選擇CSV文件');
        e.target.value = '';
      }
    }
  };

  const handleDownloadTemplate = async (): Promise<void> => {
    if (isTestMode) {
      setTemplateDownloading(true);
      // 模擬下載邏輯
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const csvContent = "code,shortCode,name,contactPerson,phone,taxId,paymentTerms,notes\nSUP001,S1,範例供應商,張三,02-11112222,12345678,月結30天,這是範例備註";
      const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mock-suppliers-template.csv');
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      setTemplateDownloading(false);
      return;
    }

    try {
      setTemplateDownloading(true);
      const blob = await actualDownloadTemplate();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'suppliers-template.csv');
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }
    } catch (err: unknown) {
      console.error('下載CSV模板失敗:', err);
      alert('下載CSV模板失敗，請稍後再試');
    } finally {
      setTemplateDownloading(false);
    }
  };

  const handleTestModeImportCsv = async (): Promise<void> => {
    setImportLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockResult: ImportResult = {
      total: 5,
      success: 3,
      failed: 1,
      duplicates: 1,
      errors: [{ row: 4, error: '模擬錯誤：欄位格式不符' }]
    };

    setImportResult(mockResult);
    setImportLoading(false);
  };

  const handleActualImportCsv = async (file: File): Promise<void> => {
    try {
      setImportLoading(true);
      const result = await actualImportCsv(file);
      setImportResult(result);
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('匯入CSV失敗:', error);
      setImportResult({
        total: 0,
        success: 0,
        failed: 0,
        duplicates: 0,
        errors: [{ error: error.message ?? '未知錯誤' }]
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportCsv = async (): Promise<void> => {
    if (!csvFile) {
      alert('請先選擇CSV文件');
      return;
    }

    if (isTestMode) {
      await handleTestModeImportCsv();
    } else {
      await handleActualImportCsv(csvFile);
    }
  };

  return {
    openImportDialog,
    setOpenImportDialog,
    csvFile,
    importLoading,
    importResult,
    templateDownloading,
    handleCloseImportDialog,
    handleOpenImportDialog,
    handleFileChange,
    handleDownloadTemplate,
    handleImportCsv
  };
};