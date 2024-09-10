import { createContext, useContext } from 'react';

const authApiUrl = import.meta.env.VITE_AUTH_API_URL;
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const getToken = () => localStorage.getItem('token');

  const login = async ({ email, password }) => {
    const response = await fetch(`${authApiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
    } else if (data.error) {
      throw new Error(data.error);
    } else {
      throw new Error('Unknown error');
    }
  };

  const register = async ({ email, password }) => {
    const response = await fetch(`${authApiUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
    } else if (data.error) {
      throw new Error(data.error);
    } else {
      throw new Error('Unknown error');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
  };

  const isLoggedIn = () => {
    return !!getToken();
  };

  const contextValue = {
    getToken,
    login,
    logout,
    register,
    isLoggedIn,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
