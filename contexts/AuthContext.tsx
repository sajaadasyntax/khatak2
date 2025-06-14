'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthState, User, ApiResponse } from '@/types';
import { postData } from '@/utils/api';
import { authService, RegisterData } from '@/services/authService';

export type UserRole = 'CLIENT' | 'DRIVER' | 'ADMIN';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, userData?: any) => Promise<void>;
  logout: () => void;
  isClient: () => boolean;
  isDriver: () => boolean;
  isAdmin: () => boolean;
  isAuthenticated: boolean;
}

// Define the expected login response structure
interface LoginResponseData {
  user: User;
  token: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to format phone number
const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it's a Saudi number with country code (966)
  if (cleaned.startsWith('966') && cleaned.length === 12) {
    return '+966' + cleaned.substring(3);
  }
  
  // If it's a Saudi number without country code (starts with 05)
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    return '+966' + cleaned.substring(1);
  }
  
  // If it's a Saudi number without country code (starts with 5)
  if (cleaned.startsWith('5') && cleaned.length === 9) {
    return '+966' + cleaned;
  }
  
  // If it doesn't match any pattern, return the original cleaned number
  return '+966' + cleaned;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for existing auth data
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const response = await authService.login({ phone: formattedPhone, password });
      
      if (!response.data) {
        throw new Error('No response data received');
      }

      // Handle nested response structure: response.data might contain the full API response
      let userAndTokenData: any = response.data;
      
      // If the data contains another nested structure (like {status: 'success', data: {...}})
      if ((userAndTokenData as any).data && typeof (userAndTokenData as any).data === 'object') {
        userAndTokenData = (userAndTokenData as any).data;
      }

      const { user: apiUser, token } = userAndTokenData;
      if (!apiUser || !token) {
        console.error('Response structure:', response);
        throw new Error('No user or token data received');
      }

      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(apiUser));
      
      // Convert authService User to context User
      const contextUser: User = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        phone: apiUser.phone || '',
        role: apiUser.role as UserRole,
        isActive: apiUser.isActive,
        isConfirmed: apiUser.isConfirmed || false,
        createdAt: apiUser.createdAt || new Date().toISOString(),
        // Convert string address to object if needed
        address: typeof apiUser.address === 'string' 
          ? { street: apiUser.address } 
          : apiUser.address as User['address']
      };

      setUser(contextUser);
      setToken(token);

      // Redirect based on role
      const role = apiUser.role.toUpperCase();
      switch (role) {
        case 'ADMIN':
          router.replace('/admin/dashboard');
          break;
        case 'DRIVER':
          router.replace('/dashboard');
          break;
        case 'CLIENT':
          router.replace('/dashboard');
          break;
        default:
          console.error('Unknown user role:', role);
          router.replace('/dashboard');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Clear any partial auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      
      // Extract the error message from the API response if available
      let errorMessage = 'Authentication failed';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details?.message) {
        errorMessage = error.details.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const register = async (phone: string, password: string, userData: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      const formattedPhone = formatPhoneNumber(phone);
      console.log('AuthContext: Attempting registration with:', formattedPhone);

      // Prepare registration data
      const registrationData: RegisterData = {
        name: userData.name || 
              (userData.firstName && userData.lastName 
                ? `${userData.firstName} ${userData.lastName}`
                : formattedPhone), // Use phone as fallback name only if no name provided
        phone: formattedPhone,
        password,
        role: userData.role || 'CLIENT', // Default to CLIENT if not specified
        
        // Include all driver-specific fields for document URLs
        ...(userData.role === 'DRIVER' && {
          // Vehicle information
          plateNumber: userData.plateNumber,
          carMake: userData.carMake,
          carModel: userData.carModel,
          carYear: userData.carYear,
          carColor: userData.carColor,
          
          // Document URLs - direct and nested for compatibility
          licenseDocumentUrl: userData.licenseDocumentUrl,
          registrationDocumentUrl: userData.registrationDocumentUrl,
          driverPhotoUrl: userData.driverPhotoUrl,
          
          // Legacy format - kept for compatibility
          driverDocuments: userData.driverDocuments || {},
          tempRegistrationId: userData.tempRegistrationId
        })
      };
      
      console.log('Registration data being sent to server:', registrationData);

      // Use authService for registration
      const response = await authService.register(registrationData);
      
      if (response.status === 'success') {
        // Registration successful - redirect to login
        // Note: Most registration endpoints return success without user data
        // User needs to login separately after registration
        console.log('Registration successful:', response.message || 'Registration completed');
        router.push('/login');
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('AuthContext: Registration error:', error);
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    router.replace('/login');
  };

  const isClient = () => user?.role === 'CLIENT';
  const isDriver = () => user?.role === 'DRIVER';
  const isAdmin = () => user?.role === 'ADMIN';

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    isClient,
    isDriver,
    isAdmin,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 