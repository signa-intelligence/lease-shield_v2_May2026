import { useQueryClient } from "@tanstack/react-query";

/**
 * Optimistic Update Utilities
 * Provides instant UI feedback while server updates happen in background
 */

export const useOptimisticUpdate = (queryKey, entityName) => {
  const queryClient = useQueryClient();

  const optimisticCreate = (newItem) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticItem = {
      ...newItem,
      id: tempId,
      created_date: new Date().toISOString(),
      _optimistic: true
    };

    queryClient.setQueryData(queryKey, (old) => {
      if (!old) return [optimisticItem];
      return [optimisticItem, ...old];
    });

    return tempId;
  };

  const optimisticUpdate = (id, updates) => {
    queryClient.setQueryData(queryKey, (old) => {
      if (!old) return old;
      return old.map(item => 
        item.id === id 
          ? { ...item, ...updates, _optimistic: true }
          : item
      );
    });
  };

  const optimisticDelete = (id) => {
    queryClient.setQueryData(queryKey, (old) => {
      if (!old) return old;
      return old.filter(item => item.id !== id);
    });
  };

  const revert = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    optimisticCreate,
    optimisticUpdate,
    optimisticDelete,
    revert
  };
};

/**
 * Hook for creating with optimistic updates
 */
export const useOptimisticMutation = (mutation, queryKey) => {
  const queryClient = useQueryClient();

  return async (data, options = {}) => {
    const { optimisticData, onSuccess, onError } = options;

    // Store previous state for rollback
    const previousData = queryClient.getQueryData(queryKey);

    // Optimistically update UI
    if (optimisticData) {
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return [optimisticData];
        return [optimisticData, ...old];
      });
    }

    try {
      // Execute mutation
      const result = await mutation.mutateAsync(data);
      
      // Success callback
      if (onSuccess) onSuccess(result);
      
      return result;
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(queryKey, previousData);
      
      // Error callback
      if (onError) onError(error);
      
      throw error;
    }
  };
};