import { useQuery } from '@tanstack/react-query';

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
      const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to fetch search results');
      return (await res.json()) as SearchResult[];
    },
    enabled: query.length >= 2,
    staleTime: 60000,
  });
};
