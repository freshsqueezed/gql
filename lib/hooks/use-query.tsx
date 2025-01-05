import { useEffect, useState, useMemo } from 'react';
import { DocumentNode } from 'graphql';
import { useMammothClient } from '../mammoth-provider';

interface QueryResult<TData> {
  data: TData | null;
  loading: boolean;
  error: string | null;
}

export function useQuery<TData = object>(
  query: DocumentNode,
  variables: Record<string, unknown> = {},
): QueryResult<TData> {
  const client = useMammothClient();
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the query and variables to prevent unnecessary re-renders
  const memoizedQuery = useMemo(() => query, [query]);
  const memoizedVariables = useMemo(() => variables, [variables]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await client.query<TData>(
          memoizedQuery,
          memoizedVariables,
        );
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
  }, [client, memoizedQuery, memoizedVariables]);

  return { data, loading, error };
}
