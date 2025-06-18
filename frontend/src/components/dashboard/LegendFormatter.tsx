import React, { FC } from 'react';
import PropTypes from 'prop-types';

/**
 * LegendFormatter 元件的 Props 介面
 */
interface LegendFormatterProps {
  value: string;
  color: string;
}

/**
 * Component for formatting legend items with custom styling
 */
const LegendFormatter: FC<LegendFormatterProps> = ({ value, color }) => {
  return <span style={{ color }}>{value}</span>;
};

LegendFormatter.propTypes = {
  value: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired
};

export default LegendFormatter;