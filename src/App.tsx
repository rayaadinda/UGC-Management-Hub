import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Login } from '@/pages/LoginPage'
import { UGCDashboard } from '@/components/UGCDashboard'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { isAuthenticated: authState, isLoading } = useAuth()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error: any) => {
              if (
                error?.message?.includes('JWT') ||
                error?.message?.includes('invalid JWT') ||
                error?.code === 'PGRST301'
              ) {
                supabase.auth.signOut()
                return false
              }
              return failureCount < 3
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
          },
          mutations: {
            retry: (failureCount, error: any) => {
              if (
                error?.message?.includes('JWT') ||
                error?.message?.includes('invalid JWT') ||
                error?.code === 'PGRST301'
              ) {
                supabase.auth.signOut()
                return false
              }
              return failureCount < 3
            },
          },
        },
      })
  )

  useEffect(() => {
    setIsAuthenticated(authState)
  }, [authState])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <UGCDashboard />
      <Toaster />
    </QueryClientProvider>
  )
}
