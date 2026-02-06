'use client';

import { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { Toaster } from '@/components/ui/sonner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#18181b',
            border: '1px solid #27272a',
            color: '#fafafa',
          },
        }}
      />
    </AuthProvider>
  );
}

export { AuthProvider, useAuthContext } from './AuthProvider';
export default Providers;
