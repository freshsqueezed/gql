import { DocumentNode, print } from 'graphql';

//
export interface HttpLinkOptions {
  uri: string;
  headers?: Record<string, string>;
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

  async query(query: DocumentNode, variables: object = {}) {
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
      });

      if (!response.ok) {
        throw new Error(`Network error: ${response.statusText}`);
      }

      const responseBody = await response.json();
      if (responseBody.errors) {
        throw new Error(
          `GraphQL error: ${JSON.stringify(responseBody.errors)}`,
        );
      }

      return responseBody.data;
    } catch (error) {
      console.error('GraphQL query failed', error);
      throw error;
    }
  }
}
