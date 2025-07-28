import React from 'react';
import {
  Autocomplete,
  TextField
} from '@mui/material';
import { Organization, OrganizationType } from '@pharmacy-pos/shared/types/organization';

/**
 * 組織選擇組件的 Props 介面
 */
interface OrganizationSelectProps {
  organizations?: Organization[];
  selectedOrganization?: Organization | null;
  onChange: (event: React.SyntheticEvent, value: Organization | null) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  size?: 'small' | 'medium';
  onEnterKeyDown?: (inputValue: string) => void;
  showCode?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

/**
 * 組織選擇組件
 * 提供組織的自動完成選擇功能，支援按名稱和代碼搜尋
 */
const OrganizationSelect: React.FC<OrganizationSelectProps> = ({
  organizations = [],
  selectedOrganization,
  onChange,
  label = "機構",
  required = false,
  error = false,
  helperText = "",
  size = "medium",
  onEnterKeyDown,
  showCode = true,
  autoFocus = false,
  disabled = false
}) => {
  // 組織過濾函數
  const filterOrganizations = (options: Organization[], inputValue: string): Organization[] => {
    const filterValue = inputValue?.toLowerCase() || '';
    return options.filter(option =>
      option?.name?.toLowerCase().includes(filterValue) ||
      option?.code?.toLowerCase().includes(filterValue)
    );
  };

  return (
    <Autocomplete
      id="organization-select"
      options={organizations}
      getOptionLabel={(option) => (option as Organization)?.name ?? ''}
      value={selectedOrganization}
      onChange={(event, value) => onChange(event, value as Organization | null)}
      disabled={disabled}
      filterOptions={(options, state) => filterOrganizations(options as Organization[], state.inputValue)}
      onKeyDown={(event) => {
        if (['Enter', 'Tab'].includes(event.key)) {
          const target = event.target as HTMLInputElement;
          const inputValue = target.value;
          
          // 獲取過濾後的組織列表
          const filtered = filterOrganizations(organizations, inputValue);
          
          // 如果有過濾結果，自動選擇第一個選項
          if (filtered.length > 0 && filtered[0]) {
            // 選擇第一個選項
            onChange(event, filtered[0]);
            event.preventDefault();
            
            // 延遲執行，確保選擇已完成
            setTimeout(() => {
              // 如果提供了Enter鍵回調函數，則調用它
              if (onEnterKeyDown) {
                onEnterKeyDown(inputValue);
              } else {
                // 如果沒有提供回調函數，則嘗試將焦點移至下一個欄位
                const nextField = document.getElementById('status-select');
                if (nextField) {
                  nextField.focus();
                }
              }
            }, 50);
          }
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          fullWidth
          required={required}
          error={error}
          helperText={helperText}
          size={size}
          autoFocus={autoFocus}
          InputLabelProps={{
            ...params.InputLabelProps,
            className: params.InputLabelProps?.className || '',
            style: params.InputLabelProps?.style || {}
          }}
        />
      )}
      {...(showCode && {
        renderOption: (props, option) => (
          <li {...props}>
            {(option as Organization).name}
            {(option as Organization).code && (
              <span style={{color: 'gray', marginLeft: '8px'}}>
                ({(option as Organization).code})
              </span>
            )}
            {(option as Organization).type && (
              <span style={{color: 'blue', marginLeft: '4px', fontSize: '0.8em'}}>
                [{getOrganizationTypeLabel((option as Organization).type)}]
              </span>
            )}
          </li>
        )
      })}
    />
  );
};

/**
 * 獲取組織類型的中文標籤
 */
const getOrganizationTypeLabel = (type: OrganizationType): string => {
  const typeLabels: Record<OrganizationType, string> = {
    [OrganizationType.PHARMACY]: '藥局',
    [OrganizationType.CLINIC]: '診所',
    [OrganizationType.HEADQUARTERS]: '總部'
  };
  return typeLabels[type] || type;
};

export default OrganizationSelect;