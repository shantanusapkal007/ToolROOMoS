import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface SearchResult {
  id: string;
  type: string;
  label: string;
  path: string;
  icon: string;
}

export const useGlobalSearch = (query: string) => {
  return useQuery({
    queryKey: ['globalSearch', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
      return res.data as SearchResult[];
    },
    enabled: query.length >= 2,
    staleTime: 60000,
  });
};
