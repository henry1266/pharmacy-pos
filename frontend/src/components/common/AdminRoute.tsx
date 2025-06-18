import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * 用戶介面
 */
interface User {
  role?: string;
  [key: string]: any;
}

/**
 * 從 localStorage 獲取用戶角色
 */
const getUserRole = (): string | null => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user: User = JSON.parse(storedUser);
      return user.role || null;
    } catch (error) {
      console.error("Failed to parse user data from localStorage for role check", error);
      return null;
    }
  }
  return null;
};

/**
 * Admin Route Guard Component
 * Checks if the user has the 'admin' role.
 * If yes, renders the child component (Outlet).
 * If no, redirects to the dashboard.
 */
const AdminRoute: React.FC = () => {
  const userRole = getUserRole();

  // If user is admin, allow access to the route
  if (userRole === 'admin') {
    const OutletComponent = Outlet as any;
    return <OutletComponent />; // Renders the nested child route component
  }

  // If user is not admin (or role couldn't be determined), redirect to dashboard
  console.warn('Access denied: Admin role required.');
  return <Navigate to="/dashboard" replace />;
};

export default AdminRoute;