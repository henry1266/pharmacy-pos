import React from 'react';
import { useParams } from 'react-router-dom';
import OrganizationForm from '../components/organization/OrganizationForm';

const OrganizationFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const mode = id ? 'edit' : 'create';

  return (
    <OrganizationForm 
      organizationId={id} 
      mode={mode}
    />
  );
};

export default OrganizationFormPage;