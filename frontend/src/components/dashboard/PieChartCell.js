import React from 'react';
import PropTypes from 'prop-types';
import { Cell } from 'recharts';

// 完全獨立的 PieChartCell 元件
const PieChartCell = ({ entry, index, colors }) => (
  <Cell key={`cell-${entry.category}`} fill={colors[index % colors.length]} />
);

PieChartCell.propTypes = {
  entry: PropTypes.shape({
    category: PropTypes.string.isRequired,
    totalSales: PropTypes.number.isRequired
  }).isRequired,
  index: PropTypes.number.isRequired,
  colors: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default PieChartCell;
