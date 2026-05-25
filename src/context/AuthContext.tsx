import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_STORAGE_KEY = 'nexus_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
if (storedUser) {
  const parsed = JSON.parse(storedUser);
  const normalizedUser = { ...parsed, id: parsed._id || parsed.id };
  setUser(normalizedUser);
}
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user.role !== role) {
        throw new Error(`This account is registered as ${data.user.role}`);
      }
      const normalizedUser = { ...data.user, id: data.user._id || data.user.id };
localStorage.setItem('nexus_token', data.token);
localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
setUser(normalizedUser);
      toast.success('Logged in successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      toast.success('OTP sent to your email! Please verify.');
      // Store userId temporarily for OTP verification
      localStorage.setItem('nexus_pending_id', data.userId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      localStorage.setItem('nexus_pending_id', data.userId);
      toast.success('OTP sent to your email!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message);
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      const userId = localStorage.getItem('nexus_pending_id');
      await api.post('/auth/reset-password', { userId, otp: token, newPassword });
      localStorage.removeItem('nexus_pending_id');
      toast.success('Password reset successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message);
      throw error;
    }
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('nexus_token');
    toast.success('Logged out successfully');
  };

  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const { data } = await api.put('/profile/update', updates);
      const normalizedUser = { ...data.user, id: data.user._id || data.user.id };
setUser(normalizedUser);
localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message);
      throw error;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};