import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define which routes should be public (accessible without authentication)
const publicRoutes = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)'
])

// This middleware protects routes based on authentication status
export default clerkMiddleware(async (auth, req) => {
  // Check if the route is public
  if (publicRoutes(req)) {
    return
  }

  // If the user is not signed in and the route is not public, redirect to sign-in
  const { userId } = await auth()
  if (!userId) {
    return (await auth()).redirectToSignIn({ returnBackUrl: req.url })
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next/|.*\\.(?:jpg|jpeg|gif|png|svg|ico|css|js|woff|woff2)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
