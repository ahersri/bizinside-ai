import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load user profile if token exists
   */
  const loadUser = useCallback(async () => {
    try {
      const response = await authAPI.getProfile();

      const userData = response.data?.data?.user;

      if (!userData) {
        throw new Error('Invalid user data');
      }

      setUser(userData);
      setBusiness(userData.business_name || null);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Auth loadUser failed:', error);

      // Clear invalid auth state safely
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setBusiness(null);
    } finally {
      setLoading(false); // ✅ CRITICAL
    }
  }, []);

  /**
   * On app load: check token and load profile
   */
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [loadUser]);

  /**
   * Login
   */
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });

      const { token, data } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setUser(data.user);
      setBusiness(data.user.business_name || null);

      toast.success('Login successful');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  /**
   * Register
   */
  const register = async (businessData, ownerData) => {
    try {
      const response = await authAPI.register({
        business: businessData,
        owner: ownerData,
      });

      const { token, data } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setUser(data.user);
      setBusiness(data.business?.business_name || null);

      toast.success('Registration successful');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed',
      };
    }
  };

  /**
   * Logout (NO PAGE RELOAD)
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setBusiness(null);
    toast.success('Logged out successfully');
  };

  /**
   * Update profile
   */
  const updateProfile = async (payload) => {
    try {
      const response = await authAPI.updateProfile(payload);

      const updatedUser = response.data?.data?.user;

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Profile update failed');
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        loading,
        login,
        register,
        logout,
        updateProfile,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
