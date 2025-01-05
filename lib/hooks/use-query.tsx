import { useEffect, useState } from 'react';
import { DocumentNode } from 'graphql';
import { useMammothClient } from '../mammoth-provider';

interface QueryResult<TData> {
  data: TData | null;
  loading: boolean;
  error: string | null;
}

export function useQuery<TData = object>(
  query: DocumentNode,
  variables: Record<string, object> = {},
): QueryResult<TData> {
  const client = useMammothClient();
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await client.query(query, variables);
        setData(result);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || 'An error occurred');
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [client, query, variables]);

  return { data, loading, error };
}
