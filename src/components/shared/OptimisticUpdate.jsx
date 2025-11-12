import { useMutation, useQueryClient } from "@tanstack/react-query";
import { haptic } from "./HapticFeedback";

/**
 * Optimistic Update Hook
 * Provides instant UI feedback while mutations execute in background
 */
export function useOptimisticMutation({
  mutationFn,
  queryKey,
  onSuccess,
  onError,
  updateFn,
  successMessage,
  errorMessage,
  language = 'en'
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    
    // Optimistically update cache BEFORE server responds
    onMutate: async (variables) => {
      // Cancel ongoing queries to avoid conflicts
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update cache
      if (updateFn) {
        queryClient.setQueryData(queryKey, (old) => updateFn(old, variables));
      }

      // Haptic feedback for instant feel
      haptic.light();

      // Return context with previous data for rollback
      return { previousData };
    },

    // On success: invalidate to fetch fresh data
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey });
      haptic.success();
      if (onSuccess) onSuccess(data, variables, context);
    },

    // On error: rollback to previous state
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      haptic.error();
      if (onError) onError(error, variables, context);
      
      const message = errorMessage || (language === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred');
      console.error('Mutation error:', error);
    },

    // Always refetch after settled
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });
}

/**
 * Optimistic Create Hook
 * Instantly shows new item in list while creating
 */
export function useOptimisticCreate({ 
  entityName, 
  queryKey,
  language = 'en',
  generateOptimisticId = () => `temp-${Date.now()}`
}) {
  return useOptimisticMutation({
    mutationFn: async (data) => {
      // Import base44 dynamically to avoid circular deps
      const { base44 } = await import('@/api/base44Client');
      return base44.entities[entityName].create(data);
    },
    queryKey,
    updateFn: (old, newData) => {
      if (!old) return [{ ...newData, id: generateOptimisticId(), _optimistic: true }];
      return [{ ...newData, id: generateOptimisticId(), _optimistic: true }, ...old];
    },
    language
  });
}

/**
 * Optimistic Update Hook
 * Instantly reflects changes while updating
 */
export function useOptimisticUpdate({
  entityName,
  queryKey,
  language = 'en'
}) {
  return useOptimisticMutation({
    mutationFn: async ({ id, data }) => {
      const { base44 } = await import('@/api/base44Client');
      return base44.entities[entityName].update(id, data);
    },
    queryKey,
    updateFn: (old, { id, data }) => {
      if (!old) return old;
      if (Array.isArray(old)) {
        return old.map(item => item.id === id ? { ...item, ...data } : item);
      }
      return old.id === id ? { ...old, ...data } : old;
    },
    language
  });
}

/**
 * Optimistic Delete Hook
 * Instantly removes item from list
 */
export function useOptimisticDelete({
  entityName,
  queryKey,
  language = 'en'
}) {
  return useOptimisticMutation({
    mutationFn: async (id) => {
      const { base44 } = await import('@/api/base44Client');
      return base44.entities[entityName].delete(id);
    },
    queryKey,
    updateFn: (old, deletedId) => {
      if (!old) return old;
      if (Array.isArray(old)) {
        return old.filter(item => item.id !== deletedId);
      }
      return null;
    },
    language
  });
}