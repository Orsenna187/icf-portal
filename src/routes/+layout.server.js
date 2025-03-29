import { adminAuth } from '$lib/server/admin';
import { redirect } from '@sveltejs/kit';

// Define routes that don't require authentication
const publicRoutes = ['/login', '/signup']; 

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ cookies, url }) {
    let user = null;
    let error = null;

    try {
        const sessionCookie = cookies.get('__session');
        
        if (sessionCookie) {
            // Verify the session cookie. Force checkRevoked to true.
            const decodedClaims = await adminAuth.verifySessionCookie(
                sessionCookie, true /** checkRevoked */
            );
            // You can retrieve additional user data from Firebase Auth or your DB here if needed
            // const userData = await adminAuth.getUser(decodedClaims.uid);
            user = {
                uid: decodedClaims.uid,
                email: decodedClaims.email,
                emailVerified: decodedClaims.email_verified,
                // Add other relevant claims or data
                // name: userData.displayName,
                // picture: userData.photoURL,
            };
            console.log('Server load: Valid session cookie found for UID:', user.uid);
        } else {
            console.log('Server load: No session cookie found.');
        }
    } catch (e) {
        // Session cookie is invalid or revoked. Clear it.
        console.warn('Server load: Error verifying session cookie:', e.code);
        cookies.delete('__session', { path: '/' });
        user = null;
        // Don't throw error here, just return null user unless it's a critical setup issue
    }

    // Redirect logic based on authentication status and route
    const isPublicRoute = publicRoutes.includes(url.pathname);

    if (!user && !isPublicRoute) {
        // Not logged in and trying to access a protected route
        console.log(`Server load: Redirecting unauthenticated user from ${url.pathname} to /login.`);
        redirect(303, '/login'); // Use 303 for POST redirects if needed, 307/302 otherwise
    }

    if (user && isPublicRoute) {
        // Logged in and trying to access a public route (e.g., /login)
        console.log(`Server load: Redirecting authenticated user from ${url.pathname} to /.`);
        redirect(303, '/'); // Redirect to home page or dashboard
    }

    // Make user data available to the layout and pages
    return {
        user: user // This will be available as `data.user` in +layout.svelte and subsequent +page.svelte loads
    };
} 