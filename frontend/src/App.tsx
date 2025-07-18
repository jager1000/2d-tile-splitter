import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MapGeneratorApp } from './components/MapGeneratorApp';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-dark-200 text-white">
        <MapGeneratorApp />
      </div>
    </QueryClientProvider>
  );
}

export default App;
