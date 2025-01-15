import { describe, it, expect, vi } from 'vitest';
import { gql } from 'graphql-tag';
import { DocumentNode, print } from 'graphql';
import { HttpLink, GraphQLCache, MammothClient } from '../mammoth-client';

describe('MammothClient', () => {
  const uri = 'https://example.com/graphql';
  const query: DocumentNode = gql`
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
      }
    }
  `;
  const variables = { id: '1' };
  const responseData = { user: { id: '1', name: 'John Doe' } };

  it('should return data from the cache', async () => {
    const link = new HttpLink({ uri });
    const cache = new GraphQLCache();
    const client = new MammothClient({ link, cache });

    // Simulate the cache already having data
    cache.set(query, variables, responseData);

    const result = await client.query(query, variables);

    expect(result).toEqual(responseData);
  });

  it('should fetch data if not in cache and set it', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: responseData }),
    });
    global.fetch = fetchMock;

    const link = new HttpLink({ uri });
    const cache = new GraphQLCache();
    const client = new MammothClient({ link, cache });

    // Correct the body format and ensure it matches the expected query
    const expectedBody = JSON.stringify({
      query: print(query), // This will ensure the query is stringified as expected
      variables,
    });

    await client.query(query, variables);

    expect(fetchMock).toHaveBeenCalledWith(
      uri,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expectedBody, // Ensure that the body matches the formatted query
        credentials: 'same-origin', // Check the default credentials setting
      }),
    );

    expect(cache.get(query, variables)).toEqual(responseData);
  });

  it('should throw error if response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ errors: [{ message: 'Internal Server Error' }] }),
    });
    global.fetch = fetchMock;

    const link = new HttpLink({ uri });
    const cache = new GraphQLCache();
    const client = new MammothClient({ link, cache });

    await expect(client.query(query, variables)).rejects.toThrowError(
      'Network error: 500 Internal Server Error',
    );
  });

  it('should handle GraphQL errors from response', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: null,
        errors: [{ message: 'GraphQL error occurred' }],
      }),
    });
    global.fetch = fetchMock;

    const link = new HttpLink({ uri });
    const cache = new GraphQLCache();
    const client = new MammothClient({ link, cache });

    await expect(client.query(query, variables)).rejects.toThrowError(
      'GraphQL error: [{"message":"GraphQL error occurred"}]',
    );
  });

  it('should cache the response', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: responseData }),
    });
    global.fetch = fetchMock;

    const link = new HttpLink({ uri });
    const cache = new GraphQLCache();
    const client = new MammothClient({ link, cache });

    await client.query(query, variables);
    const cachedData = cache.get(query, variables);

    expect(cachedData).toEqual(responseData);
  });

  it('should clear cache', () => {
    const cache = new GraphQLCache();

    cache.set(query, variables, responseData);
    cache.clear();

    expect(cache.get(query, variables)).toBeNull();
  });
});
