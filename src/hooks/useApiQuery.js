import { QueryClient, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export { queryClient };

export function useApiQuery(queryKey, queryFn, options = {}) {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    enabled: options.enabled ?? true,
    ...options,
  });
}

export function useApiMutation(mutationFn, options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: options.onSuccess
      ? (data, variables, context) => {
          options.onSuccess(data, variables, context);
          queryClient.invalidateQueries({ queryKey: options.queryKey });
        }
      : undefined,
    ...options,
  });
}

export default queryClient;
