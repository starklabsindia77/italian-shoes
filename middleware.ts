import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes accessible to everyone
const PUBLIC_ROUTES = ['/', '/login', '/register', '/about'];

// Private routes with role-based access
const ROLE_BASED_ROUTES: { [key: string]: string[] } = {
    '/admin': ['admin'],
    '/dashboard': ['admin', 'user'],
    '/settings': ['admin'],
    '/profile': ['user', 'admin'],
};

// Utility function to check if the user's role allows access
function hasAccess(path: string, userRole: string | undefined): boolean {
    for (const route in ROLE_BASED_ROUTES) {
        if (path.startsWith(route)) {
            return ROLE_BASED_ROUTES[route].includes(userRole || '');
        }
    }
    return false; // Deny access if no match is found
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Simulated authentication check (replace with real logic)
    const authToken = request.cookies.get('auth_token');
    const userRole = request.cookies.get('user_role')?.value; // e.g., 'admin' or 'user'

    const isAuthenticated = !!authToken;

    // Handle public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL('/dashboard', request.url)); // Redirect logged-in users
        }
        return NextResponse.next();
    }

    // Handle private routes
    if (!isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.url)); // Redirect unauthenticated users
    }

    // Handle role-based access control
    if (!hasAccess(pathname, userRole)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url)); // Redirect to unauthorized page
    }

    // Allow access if all checks pass
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/', 
        '/login', 
        '/register', 
        '/about',
        '/admin/:path*',
        '/dashboard/:path*',
        '/profile/:path*',
        '/settings/:path*',
    ],
};
