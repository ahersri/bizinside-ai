import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from './apiService';
import { toast } from 'react-hot-toast';

// Products hooks
export const useProducts = (params) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => apiService.products.getProducts(params),
    select: (response) => response.data.data,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => apiService.products.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Product created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create product');
    },
  });
};

// Sales hooks
export const useSales = (params) => {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: () => apiService.sales.getSales(params),
    select: (response) => response.data.data,
  });
};

// Dashboard hooks
export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiService.dashboard.getOverview(),
    select: (response) => response.data.data,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Inventory hooks
export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => apiService.inventory.getOverview(),
    select: (response) => response.data.data,
  });
};

// User profile hook
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiService.auth.getProfile(),
    select: (response) => response.data.data.user,
    enabled: !!localStorage.getItem('token'),
  });
};