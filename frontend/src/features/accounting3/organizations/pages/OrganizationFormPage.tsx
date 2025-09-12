import React from 'react';
import { useParams } from 'react-router-dom';
import { OrganizationForm } from '..';

/**
 * 組織表單頁面
 *
 * 這是一個簡單的包裝組件，用於顯示組織表單
 */
const OrganizationFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const mode = id ? 'edit' : 'create';

  return (
    <OrganizationForm
      organizationId={id || ''}
      mode={mode}
    />
  );
};

export default OrganizationFormPage;