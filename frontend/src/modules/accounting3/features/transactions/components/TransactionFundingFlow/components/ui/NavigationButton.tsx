import React from 'react';
import { Button } from '@mui/material';
import { NavigationButtonProps } from '../../types';
import { extractObjectId, isValidObjectId } from '../../../../utils/transactionUtils';

/**
 * 導航按鈕組件
 * 用於導航到特定交易的詳情頁面
 */
const NavigationButton: React.FC<NavigationButtonProps> = ({ 
  transactionId, 
  label = '查看', 
  navigate 
}) => {
  const cleanId = extractObjectId(transactionId);
  const isValid = cleanId && isValidObjectId(cleanId);
  
  return (
    <Button
      variant="outlined"
      size="small"
      onClick={() => {
        if (isValid) {
          console.log(`✅ 導航到交易: /accounting3/transaction/${cleanId}`);
          navigate(`/accounting3/transaction/${cleanId}`);
        } else {
          console.error('❌ 無效的交易 ID:', transactionId);
        }
      }}
      disabled={!isValid}
    >
      {isValid ? label : '無效'}
    </Button>
  );
};

export default NavigationButton;