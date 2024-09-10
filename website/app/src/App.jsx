import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import ChatPage from './chat/ChatPage';
import LoginPage from './auth/LoginPage';
import RegistrationPage from './auth/RegistrationPage';
import Layout from './app/Layout';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import AuthLayout from './app/AuthLayout';

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegistrationPage />} />
      </Route>
      <Route path='' element={<Layout />}>
        <Route element={<ProtectedRoute loginPath='/login' />}>
          <Route path='' element={<Navigate to='/chat' />} />
          <Route path='/chat' element={<ChatPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
