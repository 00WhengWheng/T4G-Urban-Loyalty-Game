// hooks/useApi.ts
export const useApi = <T>(endpoint: string) => {
  return useQuery(endpoint, () => apiClient.get(endpoint), {
    staleTime: 5 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      toast.error(`Errore API: ${error.message}`);
    }
  });
};