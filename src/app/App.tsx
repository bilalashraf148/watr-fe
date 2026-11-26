import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router/dom";
import { router } from "@/app/router";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Toaster } from "@/components/ui/Toaster";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <Toaster />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
