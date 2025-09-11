import { useState } from 'react';
import { SupplierData, SupplierFormState } from '../types/supplier.types';

export const useSupplierForm = () => {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [currentSupplierState, setCurrentSupplierState] = useState<SupplierFormState>({
    id: null,
    code: '',
    shortCode: '',
    name: '',
    contactPerson: '',
    phone: '',
    taxId: '',
    paymentTerms: '',
    notes: ''
  });
  const [editMode, setEditMode] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setCurrentSupplierState({ ...currentSupplierState, [name]: value });
  };

  const handleEditSupplier = (supplier: SupplierData): void => {
    setCurrentSupplierState({
      id: supplier.id,
      code: supplier.code ?? '',
      shortCode: supplier.shortCode ?? '',
      name: supplier.name ?? '',
      contactPerson: supplier.contactPerson ?? '',
      phone: supplier.phone ?? '',
      taxId: supplier.taxId ?? '',
      paymentTerms: supplier.paymentTerms ?? '',
      notes: supplier.notes ?? ''
    });
    setEditMode(true);
    setOpenDialog(true);
  };

  const handleAddSupplier = (): void => {
    setCurrentSupplierState({
      id: null,
      code: '',
      shortCode: '',
      name: '',
      contactPerson: '',
      phone: '',
      taxId: '',
      paymentTerms: '',
      notes: ''
    });
    setEditMode(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = (): void => {
    setOpenDialog(false);
  };

  const resetForm = (): void => {
    setCurrentSupplierState({
      id: null,
      code: '',
      shortCode: '',
      name: '',
      contactPerson: '',
      phone: '',
      taxId: '',
      paymentTerms: '',
      notes: ''
    });
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