# @freshsqueezed/mammothreact

`@freshsqueezed/mammothreact` is a powerful React library that integrates seamlessly with GraphQL. It simplifies creating a client for your GraphQL API and handling queries in your React components.

This guide walks you through setting up a Mammoth Client and using it to fetch data using GraphQL queries in your React application.

## Installation

First, install the package via npm:

```bash
npm install @freshsqueezed/gql graphql graphql-tag
```

## Setup

### Creating the Mammoth Client

To connect to your GraphQL API, you need to create a MammothClient and wrap your application in a MammothProvider. This provider will enable GraphQL queries and mutations within your app.

Here’s how you can set it up in your main entry file (e.g., main.tsx):

```tsx
// ./src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MammothProvider, MammothClient, HttpLink } from '@freshsqueezed/gql';
import App from './components/app';

const client = new MammothClient({
  link: new HttpLink({
    uri: 'http://localhost:3000/graphql',
    credentials: 'include',
  }),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MammothProvider {...{ client }}>
      <App />
    </MammothProvider>
  </StrictMode>,
);
```

### Using Queries in Components

Now that your client is set up, you can execute GraphQL queries using the `useQuery` hook from `@freshsqueezed/gql`.

Here’s an example of a component that fetches user information and displays a personalized greeting:

```tsx
// ./src/components/app

import { useQuery } from '@freshsqueezed/gql';
import gql from 'graphql-tag';

const ME_QUERY = gql`
  query ME {
    me {
      id
      email
      firstName
    }
  }
`;

interface MeQueryData {
  me: {
    id: string;
    email: string;
    firstName: string;
  };
}

function Home() {
  const { data, loading, error } = useQuery<MeQueryData>(ME_QUERY);

  if (loading) return <div>Loading...</div>;

  if (error) throw new Error(error);

  return <div>Hello {data?.me?.firstName ?? 'Guest'}!</div>;
}

export default Home;
```

### Explanation:

1. Defining a GraphQL Query: The `ME_QUERY` fetches the authenticated user’s ID, email, and first name from your GraphQL server.

2. `useQuery` Hook: The `useQuery` hook from `@freshsqueezed/gql` is used to execute the GraphQL query within the component. It returns the data, loading, and error states, making it easy to manage UI based on the query’s status.

3. Handling States:
   - If the query is still loading, we display a loading message.
   - If there's an error, it’s displayed to the user.
   - Once data is successfully fetched, we greet the user by their first name.

### Customization:

- `GraphQL URI`: In the `MammothClient` setup, change the uri in the `HttpLink` to your actual GraphQL server's address.

- Credentials: Modify the credentials option based on how your API handles authentication (e.g., same-origin, omit).

### Conclusion

`@freshsqueezed/gql` makes it easy to integrate GraphQL with your React application by providing a simple API for defining clients and executing queries. With a few lines of code, you can fetch data from your GraphQL server and render it efficiently in your components.
