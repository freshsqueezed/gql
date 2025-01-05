import { DocumentNode, print } from 'graphql';

// Define the HttpLinkOptions interface with optional headers
export interface HttpLinkOptions {
  uri: string;
  headers?: Record<string, string>;
}

// Define the HttpLink class that stores the options
export class HttpLink {
  options: HttpLinkOptions;

  constructor(options: HttpLinkOptions) {
    this.options = options;
  }
}

// Define the MammothClientOptions interface with a required HttpLink
export interface MammothClientOptions {
  link: HttpLink;
}

// Define the MammothClient class that uses the HttpLink to send requests
export class MammothClient {
  link: HttpLink;

  constructor({ link }: MammothClientOptions) {
    this.link = link;
  }

  // Define the query method that sends a GraphQL query using fetch
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
          query: print(query), // Convert DocumentNode to a string query using graphql `print`
          variables,
        }),
      });

      // Check if the response was successful
      if (!response.ok) {
        throw new Error(
          `Network error: ${response.status} ${response.statusText}`,
        );
      }

      // Parse the JSON response
      const responseBody = await response.json();

      // Check for GraphQL errors
      if (responseBody.errors) {
        throw new Error(
          `GraphQL error: ${JSON.stringify(responseBody.errors)}`,
        );
      }

      // Return the data from the response
      return responseBody.data as TData;
    } catch (error) {
      console.error('GraphQL query failed', error);
      throw error;
    }
  }
}
