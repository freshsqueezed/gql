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

export class GraphQLCache {
  private cache: Map<string, { data: unknown; expiry: number }>;
  private maxAge: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxAge = options.maxAge || 300000;
  }

  private generateCacheKey(
    query: DocumentNode,
    variables: Record<string, unknown>,
  ): string {
    return JSON.stringify({ query: print(query), variables });
  }

  get(query: DocumentNode, variables: Record<string, unknown>): unknown | null {
    const key = this.generateCacheKey(query, variables);
    const cached = this.cache.get(key);

    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    this.cache.delete(key);
    return null;
  }

  set(
    query: DocumentNode,
    variables: Record<string, unknown>,
    data: unknown,
  ): void {
    const key = this.generateCacheKey(query, variables);
    this.cache.set(key, { data, expiry: Date.now() + this.maxAge });
  }

  clear(): void {
    this.cache.clear();
  }
}

export interface MammothClientOptions {
  link: HttpLink;
  cache: GraphQLCache;
}

export class MammothClient {
  link: HttpLink;
  cache: GraphQLCache;

  constructor({ link, cache }: MammothClientOptions) {
    this.link = link;
    this.cache = cache;
  }

  async query<TData = unknown>(
    query: DocumentNode,
    variables: Record<string, unknown> = {},
  ): Promise<TData> {
    const cachedData = this.cache?.get(query, variables);
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

      const data = responseBody.data as TData;

      this.cache.set(query, variables, data);

      return data;
    } catch (error) {
      console.error('GraphQL query failed', error);
      throw error;
    }
  }
}
