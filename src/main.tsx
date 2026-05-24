import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import App from './App'
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on network errors (API unavailable)
        if ((error as { code?: string })?.code === 'ERR_NETWORK') return false
        return failureCount < 1
      },
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: '#fff',
                  color: '#1A1A1A',
                  border: '1px solid #E5E5E5',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  fontSize: '14px',
                  fontWeight: 500,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                },
                success: {
                  iconTheme: { primary: '#6B4CE6', secondary: '#fff' },
                  style: { borderLeft: '4px solid #6B4CE6' },
                },
                error: {
                  iconTheme: { primary: '#EF4444', secondary: '#fff' },
                  style: { borderLeft: '4px solid #EF4444' },
                },
              }}
            />
          </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
