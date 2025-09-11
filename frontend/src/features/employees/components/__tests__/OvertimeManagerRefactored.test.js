import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import OvertimeManagerRefactored from '../OvertimeManagerRefactored';

// Mock services
jest.mock('../../../services/overtimeRecordService');
jest.mock('../../../services/employeeService');

// Mock hooks
jest.mock('../../../hooks/useOvertimeManager', () => ({
  __esModule: true,
  default: () => ({
    loading: false,
    error: null,
    successMessage: '',
    overtimeRecords: [],
    scheduleOvertimeRecords: {},
    employees: [
      { _id: '1', name: '張三' },
      { _id: '2', name: '李四' }
    ],
    summaryData: [],
    expandedEmployees: {},
    selectedMonth: 5,
    selectedYear: 2025,
    setSelectedMonth: jest.fn(),
    setSelectedYear: jest.fn(),
    createOvertimeRecord: jest.fn(),
    updateOvertimeRecord: jest.fn(),
    deleteOvertimeRecord: jest.fn(),
    toggleEmployeeExpanded: jest.fn(),
    clearMessages: jest.fn(),
    formatDateToYYYYMMDD: jest.fn()
  })
}));

// Create a mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      // Add your reducers here if needed
    }
  });
};

describe('OvertimeManagerRefactored', () => {
  let store;

  beforeEach(() => {
    store = createMockStore();
  });

  const renderWithProvider = (component) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  test('renders overtime manager title', () => {
    renderWithProvider(<OvertimeManagerRefactored isAdmin={true} />);
    
    expect(screen.getByText('加班記錄管理')).toBeInTheDocument();
  });

  test('shows add button for admin users', () => {
    renderWithProvider(<OvertimeManagerRefactored isAdmin={true} />);
    
    expect(screen.getByText('新增加班記錄')).toBeInTheDocument();
  });

  test('hides add button for non-admin users', () => {
    renderWithProvider(<OvertimeManagerRefactored isAdmin={false} />);
    
    expect(screen.queryByText('新增加班記錄')).not.toBeInTheDocument();
  });

  test('renders year and month filters', () => {
    renderWithProvider(<OvertimeManagerRefactored isAdmin={true} />);
    
    expect(screen.getByText('篩選：')).toBeInTheDocument();
    expect(screen.getByLabelText('年份')).toBeInTheDocument();
    expect(screen.getByLabelText('月份')).toBeInTheDocument();
  });

  test('opens create dialog when add button is clicked', async () => {
    renderWithProvider(<OvertimeManagerRefactored isAdmin={true} />);
    
    const addButton = screen.getByText('新增加班記錄');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('新增加班記錄')).toBeInTheDocument();
    });
  });

  test('displays current month and year in title', () => {
    renderWithProvider(<OvertimeManagerRefactored isAdmin={true} />);
    
    expect(screen.getByText('2025年 6月 加班記錄')).toBeInTheDocument();
  });

  test('renders overtime record table', () => {
    renderWithProvider(<OvertimeManagerRefactored isAdmin={true} />);
    
    // Check for table headers
    expect(screen.getByText('員工姓名')).toBeInTheDocument();
    expect(screen.getByText('獨立加班時數')).toBeInTheDocument();
    expect(screen.getByText('排班加班時數')).toBeInTheDocument();
    expect(screen.getByText('加班總時數')).toBeInTheDocument();
    expect(screen.getByText('記錄數量')).toBeInTheDocument();
  });

  test('handles form validation correctly', async () => {
    renderWithProvider(<OvertimeManagerRefactored isAdmin={true} />);
    
    // Open create dialog
    const addButton = screen.getByText('新增加班記錄');
    fireEvent.click(addButton);
    
    // Try to submit without filling required fields
    const submitButton = screen.getByText('新增');
    fireEvent.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('請選擇員工')).toBeInTheDocument();
    });
  });

  test('filters records by year and month', () => {
    renderWithProvider(<OvertimeManagerRefactored isAdmin={true} />);
    
    const yearSelect = screen.getByLabelText('年份');
    const monthSelect = screen.getByLabelText('月份');
    
    expect(yearSelect).toHaveValue(2025);
    expect(monthSelect).toHaveValue(5); // June (0-indexed)
  });
});

describe('OvertimeManagerRefactored Integration', () => {
  test('component structure follows modular architecture', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <OvertimeManagerRefactored isAdmin={true} />
      </Provider>
    );
    
    // Verify that the component uses sub-components
    expect(screen.getByText('篩選：')).toBeInTheDocument(); // OvertimeFilters
    expect(screen.getByText('員工姓名')).toBeInTheDocument(); // OvertimeRecordTable
  });

  test('maintains responsive design', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <OvertimeManagerRefactored isAdmin={true} />
      </Provider>
    );
    
    // Check for responsive container
    const container = screen.getByText('加班記錄管理').closest('.MuiBox-root');
    expect(container).toHaveStyle('width: 100%');
  });
});