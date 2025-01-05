import { createContext, useContext, ReactNode } from 'react';
import { MammothClient } from './mammoth-client';

// Context to store the client
const MammothClientContext = createContext<MammothClient | null>(null);

// Define the provider properties
interface MammothProviderProps {
  client: MammothClient;
  children: ReactNode;
}

// MammothProvider component
export const MammothProvider = ({ client, children }: MammothProviderProps) => {
  return (
    <MammothClientContext.Provider value={client}>
      {children}
    </MammothClientContext.Provider>
  );
};

// Hook to use the GraphQL client in the components
export const useMammothClient = (): MammothClient => {
  const client = useContext(MammothClientContext);
  if (!client) {
    throw new Error('useMammothClient must be used within a MammothProvider');
  }
  return client;
};
