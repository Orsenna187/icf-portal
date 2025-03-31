import { getAdminAuth } from '$lib/server/admin';
import { redirect } from '@sveltejs/kit';

// Define routes that don't require authentication
const publicRoutes = ['/login']; 

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

            // Extract role from custom claims, default to 'user' if not present
            const role = decodedClaims.role || 'user'; 
            
            user = {
                uid: decodedClaims.uid,
                email: decodedClaims.email,
                emailVerified: decodedClaims.email_verified,
                role: role, // Add role to user object
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

    // --- Redirect logic based on authentication status, role, and route ---
    const isPublicRoute = publicRoutes.includes(url.pathname);
    const isAdminRoute = url.pathname.startsWith('/admin');

    // 1. Not logged in, trying to access a protected route (non-public)
    if (!user && !isPublicRoute) {
        console.log(`Server load: Redirecting unauthenticated user from ${url.pathname} to /login.`);
        redirect(303, '/login'); 
    }

    // 2. Logged in, trying to access a public route
    if (user && isPublicRoute) {
        console.log(`Server load: Redirecting authenticated user from ${url.pathname} to /.`);
        redirect(303, '/'); 
    }

    // 3. Logged in, but NOT an admin, trying to access an admin route
    if (user && user.role !== 'admin' && isAdminRoute) {
        console.log(`Server load: Redirecting non-admin user from ${url.pathname} to /.`);
        redirect(303, '/'); // Redirect non-admins away from admin area
    }
    
    // 4. Logged in AS ADMIN, trying to access a public route (already handled by 2, but good to be explicit if needed)
    // No specific redirect needed here unless admins shouldn't see login/signup

    // --- End Redirect Logic ---

    // Make user data available to the layout and pages
    return {
        user: user // This will be available as `data.user` in +layout.svelte and subsequent +page.svelte loads
    };
} 