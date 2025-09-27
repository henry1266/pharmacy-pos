import { useState } from 'react';
import { SupplierData, SupplierFormState } from '../types/supplier.types';

const createDefaultState = (): SupplierFormState => ({
  id: null,
  code: '',
  shortCode: '',
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  taxId: '',
  paymentTerms: '',
  notes: '',
  isActive: true
});

export const useSupplierForm = () => {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [currentSupplierState, setCurrentSupplierState] = useState<SupplierFormState>(createDefaultState());
  const [editMode, setEditMode] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setCurrentSupplierState((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSupplier = (supplier: SupplierData): void => {
    setCurrentSupplierState({
      id: supplier.id,
      code: supplier.code ?? '',
      shortCode: supplier.shortCode ?? '',
      name: supplier.name ?? '',
      contactPerson: supplier.contactPerson ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      taxId: supplier.taxId ?? '',
      paymentTerms: supplier.paymentTerms ?? '',
      notes: supplier.notes ?? '',
      isActive: typeof supplier.isActive === 'boolean' ? supplier.isActive : true
    });
    setEditMode(true);
    setOpenDialog(true);
  };

  const handleAddSupplier = (): void => {
    setCurrentSupplierState(createDefaultState());
    setEditMode(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = (): void => {
    setOpenDialog(false);
  };

  const resetForm = (): void => {
    setCurrentSupplierState(createDefaultState());
    setEditMode(false);
  };

  return {
    openDialog,
    setOpenDialog,
    currentSupplierState,
    setCurrentSupplierState,
    editMode,
    handleInputChange,
    handleEditSupplier,
    handleAddSupplier,
    handleCloseDialog,
    resetForm
  };
};
