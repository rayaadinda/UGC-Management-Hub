import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Login } from '@/pages/LoginPage'
import { UGCDashboard } from '@/components/UGCDashboard'
import { useAuth } from '@/hooks/useAuth'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { isAuthenticated: authState, isLoading } = useAuth()
  const [queryClient] = useState(() => new QueryClient())

  
  useEffect(() => {
    setIsAuthenticated(authState)
  }, [authState])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <UGCDashboard />
    </QueryClientProvider>
  )
}
