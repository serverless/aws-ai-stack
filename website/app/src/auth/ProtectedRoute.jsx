import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

/**
 * Simple React Router route that only allows access to authenticated users.
 */
export const ProtectedRoute = ({ loginPath }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn() ? <Outlet /> : <Navigate to={loginPath} />;
};
