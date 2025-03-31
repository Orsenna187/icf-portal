import { getAdminAuth } from '$lib/server/admin';
import { redirect } from '@sveltejs/kit';

// Define routes that don't require authentication
const publicRoutes = ['/login', '/signup']; 

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ cookies, url }) {
    console.log('+layout.server.js: Load function started');
    let user = null;
    let error = null;

    try {
        const sessionCookie = cookies.get('session'); // Use 'session' as set in the session endpoint
        
        if (sessionCookie) {
            console.log('+layout.server.js: Verifying session cookie...');
            const adminAuth = getAdminAuth(); // Get the auth instance
            const decodedClaims = await adminAuth.verifySessionCookie(
                sessionCookie, true /** checkRevoked */
            );
            console.log('+layout.server.js: Session cookie verified for UID:', decodedClaims.uid);
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
        } else {
            console.log('+layout.server.js: No session cookie found.');
        }
    } catch (e) {
        // Session cookie is invalid or revoked. Clear it.
        console.error('+layout.server.js: Error verifying session cookie:', e);
        cookies.delete('session', { path: '/' });
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