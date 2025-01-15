import { DocumentNode, print } from 'graphql';

export interface HttpLinkOptions {
  uri: string;
  headers?: Record<string, string>;
  credentials?: 'same-origin' | 'include' | 'omit';
}

export class HttpLink {
  options: HttpLinkOptions;

  constructor(options: HttpLinkOptions) {
    this.options = options;
  }
}

export interface CacheOptions {
  maxAge?: number;
}

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class GraphQLCache<TData = unknown> {
  private entityCache: Record<string, TData>;
  private queryCache: Map<string, CacheEntry<TData>>;
  private maxAge: number;

  constructor(options: CacheOptions = {}) {
    this.entityCache = {};
    this.queryCache = new Map();
    this.maxAge = options.maxAge || 300000;
  }

  private generateCacheKey(
    query: DocumentNode,
    variables: Record<string, unknown>,
  ): string {
    return JSON.stringify({
      query: print(query),
      variables,
    });
  }

  writeNormalizedData(key: string, data: TData): void {
    this.entityCache[key] = data;
  }

  readNormalizedData(key: string): TData | null {
    return this.entityCache[key] || null;
  }

  get(query: DocumentNode, variables: Record<string, unknown>): TData | null {
    const key = this.generateCacheKey(query, variables);
    const cached = this.queryCache.get(key);

    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    this.queryCache.delete(key);
    return null;
  }

  set(
    query: DocumentNode,
    variables: Record<string, unknown>,
    data: TData,
  ): void {
    const key = this.generateCacheKey(query, variables);

    this.queryCache.set(key, { data, expiry: Date.now() + this.maxAge });

    if (typeof data === 'object' && data !== null && 'id' in data) {
      const entity = data as { id: string };
      this.writeNormalizedData(entity.id, data);
    }
  }

  clear(): void {
    this.entityCache = {};
    this.queryCache.clear();
  }
}

export interface MammothClientOptions<TData> {
  link: HttpLink;
  cache: GraphQLCache<TData>;
}

export class MammothClient<TData> {
  link: HttpLink;
  cache: GraphQLCache<TData>;

  constructor({ link, cache }: MammothClientOptions<TData>) {
    this.link = link;
    this.cache = cache;
  }

  async query<TData>(
    query: DocumentNode,
    variables: Record<string, unknown> = {},
  ): Promise<TData> {
    const cachedData = this.cache.get(query, variables);

    if (cachedData) {
      return cachedData as TData;
    }

    try {
      const response = await fetch(this.link.options.uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.link.options.headers,
        },
        body: JSON.stringify({
          query: print(query),
          variables,
        }),
        credentials: this.link.options.credentials ?? 'same-origin',
      });

      if (!response.ok) {
        throw new Error(
          `Network error: ${response.status} ${response.statusText}`,
        );
      }

      const responseBody = await response.json();

      if (responseBody.errors) {
        throw new Error(
          `GraphQL error: ${JSON.stringify(responseBody.errors)}`,
        );
      }

      const data = responseBody.data;

      this.cache.set(query, variables, data);

      return data;
    } catch (error) {
      console.error('GraphQL query failed', error);
      throw error;
    }
  }
}
