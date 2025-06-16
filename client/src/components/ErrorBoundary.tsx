// components/ErrorBoundary.tsx
export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <ErrorBoundaryProvider>
        {children}
      </ErrorBoundaryProvider>
    </React.Suspense>
  );
};