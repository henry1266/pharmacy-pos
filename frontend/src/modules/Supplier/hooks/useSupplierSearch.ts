import { useState, useEffect } from 'react';
import { SupplierData } from '../types/supplier.types';

export const useSupplierSearch = (suppliers: SupplierData[]) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredSuppliers, setFilteredSuppliers] = useState<SupplierData[]>([]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSuppliers(suppliers);
    } else {
      const filtered = suppliers.filter(supplier =>
        supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.shortCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
  }, [suppliers, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = (): void => {
    setSearchTerm('');
  };

  return {
    searchTerm,
    filteredSuppliers,
    handleSearchChange,
    handleClearSearch
  };
};