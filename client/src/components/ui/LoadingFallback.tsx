import React, { Suspense } from 'react';

interface LoadingFallbackProps {
  children: React.ReactNode;
}

export function LoadingFallback({ children }: LoadingFallbackProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      {children}
    </Suspense>
  );
}
