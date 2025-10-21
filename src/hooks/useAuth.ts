import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
                
        setIsAuthenticated(!!session)
        setIsLoading(false)

        if (event === 'SIGNED_OUT') {
                  } else if (event === 'TOKEN_REFRESHED') {
                  }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const getInitialSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
                setIsAuthenticated(false)
      } else {
        setIsAuthenticated(!!session)
      }
    } catch (error) {
            setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    setIsAuthenticated(true)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
  }

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  }
}