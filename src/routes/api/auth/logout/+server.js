import { json } from '@sveltejs/kit';
import { adminAuth } from '$lib/server/admin';

/** @type {import('./$types').RequestHandler} */
export async function POST({ cookies }) {
    try {
        const sessionCookie = cookies.get('__session');

        if (sessionCookie) {
            // Optionally revoke the session cookie on the server side
            // This prevents the cookie from being used again even if stolen
            // Note: This requires verifying the cookie first to get the UID
            try {
                const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
                await adminAuth.revokeRefreshTokens(decodedClaims.sub); // sub is the user ID
                console.log('Successfully revoked tokens for UID:', decodedClaims.sub);
            } catch (error) {
                 // Ignore errors if cookie is invalid or expired, just clear it
                 console.warn('Error verifying or revoking session cookie during logout:', error.code);
            }

            // Delete the session cookie
            cookies.delete('__session', { path: '/' });
            console.log('Session cookie deleted.');
        } else {
            console.log('No session cookie found to delete during logout.');
        }

        return json({ status: 'success' });

    } catch (error) {
        console.error('Error during logout:', error);
        return json({ error: 'Internal server error during logout.' }, { status: 500 });
    }
}
 