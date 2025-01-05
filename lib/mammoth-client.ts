import { DocumentNode, print } from 'graphql';

export interface HttpLinkOptions {
  uri: string;
  headers?: Record<string, string>;
  credentials?: 'same-origin' | 'include' | 'omit'; // Default can be 'same-origin'
}

export class HttpLink {
  options: HttpLinkOptions;

  constructor(options: HttpLinkOptions) {
    this.options = options;
  }
}

export interface MammothClientOptions {
  link: HttpLink;
}

export class MammothClient {
  link: HttpLink;

  constructor({ link }: MammothClientOptions) {
    this.link = link;
  }

  async query<TData = unknown>(
    query: DocumentNode,
    variables: Record<string, unknown> = {},
  ): Promise<TData> {
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

      return responseBody.data as TData;
    } catch (error) {
      console.error('GraphQL query failed', error);
      throw error;
    }
  }
}
