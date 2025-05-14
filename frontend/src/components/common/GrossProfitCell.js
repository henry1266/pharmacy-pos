import React from 'react';
import { TableCell } from '@mui/material';
import PropTypes from 'prop-types';

const GrossProfitCell = ({ fifoProfit }) => {
  const grossProfitValue = fifoProfit?.grossProfit;
  const textColor = grossProfitValue !== undefined && grossProfitValue >= 0 ? 'success.main' : 'error.main';

  return (
    <TableCell align="right" sx={{ color: textColor }}>
      {grossProfitValue !== undefined ? grossProfitValue.toFixed(2) : 'N/A'}
    </TableCell>
  );
};

GrossProfitCell.propTypes = {
  fifoProfit: PropTypes.shape({
    grossProfit: PropTypes.number,
    // Potentially other properties like totalCost, profitMargin if needed in the future
  }),
};

GrossProfitCell.defaultProps = {
  fifoProfit: null,
};

export default GrossProfitCell;

