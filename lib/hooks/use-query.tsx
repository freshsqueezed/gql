import { useEffect, useState, useRef, useCallback } from 'react';
import { DocumentNode } from 'graphql';
import { useMammothClient } from '../mammoth-provider';

interface QueryResult<TData> {
  data: TData | null;
  loading: boolean;
  error: string | null;
}

interface QueryOptions {
  variables?: Record<string, unknown>;
}

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

async function fetchGraphQLData<TData>(
  client: ReturnType<typeof useMammothClient>,
  query: DocumentNode,
  variables: Record<string, unknown>,
): Promise<TData> {
  try {
    const result = await client.query<TData>(query, variables);
    return result;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'An unknown error occurred',
    );
  }
}

export function useQuery<TData = object>(
  query: DocumentNode,
  options: QueryOptions = {},
): QueryResult<TData> {
  const { variables = {} } = options;
  const client = useMammothClient();
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const prevVariables = usePrevious(variables);

  const isVariablesChanged = useCallback(() => {
    return JSON.stringify(prevVariables) !== JSON.stringify(variables);
  }, [prevVariables, variables]);

  useEffect(() => {
    // Only fetch data if variables have changed or the previous data was not loaded
    if (!isVariablesChanged()) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await fetchGraphQLData<TData>(client, query, variables);
        setData(result);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setData(null);
          setError(err.message || 'An error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [client, query, variables, isVariablesChanged]);

  return { data, loading, error };
}
