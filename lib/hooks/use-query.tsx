import { useEffect, useState, useMemo } from 'react';
import { DocumentNode } from 'graphql';
import { useMammothClient } from '../mammoth-provider';

interface QueryResult<TData> {
  data: TData | null;
  loading: boolean;
  error: string | null;
}

export function useQuery<TData = Record<string, unknown>>(
  query: DocumentNode,
  variables: Record<string, unknown> = {},
): QueryResult<TData> {
  const client = useMammothClient();
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedVariables = useMemo(() => variables, [variables]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const result = await client.query<TData>(query, memoizedVariables);

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
  }, [client, query, memoizedVariables]);

  return { data, loading, error };
}
