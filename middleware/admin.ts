import type { Database } from '~/types/database.types'

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const user = useSupabaseUser()
  const client = useSupabaseClient<Database>()

  // If no user, redirect to login
  if (!user.value) {
    console.log('[Admin Middleware] No user, redirecting to login')
    if (import.meta.server) {
      return navigateTo('/auth/login', { redirectCode: 302 })
    }
    return navigateTo('/auth/login')
  }

  console.log('[Admin Middleware] User found:', user.value.id)

  try {
    // Fetch user profile to check admin status
    const { data: profile, error } = await client
      .from('profiles')
      .select('is_admin')
      .eq('id', user.value.id)
      .single()

    console.log('[Admin Middleware] Profile result:', { profile, error: error?.message })

    if (error) {
      console.error('[Admin Middleware] Error fetching profile:', error.message)
      // If error, redirect to home
      if (import.meta.server) {
        return navigateTo('/', { redirectCode: 302 })
      }
      return navigateTo('/')
    }

    // Check if user is admin
    if (!profile?.is_admin) {
      console.log('[Admin Middleware] User is NOT admin, redirecting to home')
      if (import.meta.server) {
        return navigateTo('/', { redirectCode: 302 })
      }
      return navigateTo('/')
    }

    console.log('[Admin Middleware] User IS admin, allowing access')
    // User is admin, allow access
  } catch (err) {
    console.error('[Admin Middleware] Unexpected error:', err)
    if (import.meta.server) {
      return navigateTo('/', { redirectCode: 302 })
    }
    return navigateTo('/')
  }
})

