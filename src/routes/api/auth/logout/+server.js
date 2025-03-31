import { json } from '@sveltejs/kit';
import { getAdminAuth } from '$lib/server/admin';

/** @type {import('./$types').RequestHandler} */
export async function POST({ cookies }) {
    console.log('Logout endpoint hit');
	const sessionCookie = cookies.get('session');

	if (!sessionCookie) {
        console.log('Logout: No session cookie found, cannot revoke.');
		// Can't revoke tokens if no session, but still clear the cookie client-side
	} else {
        try {
            const adminAuth = getAdminAuth();
            const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
            await adminAuth.revokeRefreshTokens(decodedClaims.sub); // sub is the user ID
            console.log('Logout: Revoked refresh tokens for UID:', decodedClaims.sub);
        } catch (error) {
            // If verifySessionCookie fails (expired, invalid), tokens likely already unusable.
            // Log the error but proceed to clear the cookie.
            console.error('Logout: Error verifying session cookie or revoking tokens:', error);
        }
    }

    // Always clear the session cookie on logout, regardless of token revocation success
    cookies.delete('session', { path: '/' }); // Ensure path matches where it was set
    console.log('Logout: Session cookie cleared.');
	
	return json({ status: 'success' });
}
 