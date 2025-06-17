// components/ErrorBoundary.tsx
import React from "react";
import { LoadingSpinner } from "./ui/LoadingSpinner";
// Import ErrorBoundaryProvider from its module
import { ErrorBoundaryProvider } from "./ErrorBoundaryProvider";

export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <ErrorBoundaryProvider>
        {children}
      </ErrorBoundaryProvider>
    </React.Suspense>
  );
};