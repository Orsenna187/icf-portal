import { json } from '@sveltejs/kit';
import { adminAuth } from '$lib/server/admin';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return json({ error: 'ID token is required.' }, { status: 400 });
        }

        // Set session expiration to 5 days. Adjust as needed.
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds

        // Verify the ID token and create a session cookie.
        const decodedIdToken = await adminAuth.verifyIdToken(idToken);
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        // Set cookie policy for session cookie.
        const options = {
            maxAge: expiresIn / 1000, // maxAge is in seconds
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            path: '/', 
            sameSite: 'lax' // Consider 'strict' for better security if applicable
        };

        cookies.set('__session', sessionCookie, options);

        console.log('Session cookie created for UID:', decodedIdToken.uid);
        return json({ status: 'success', uid: decodedIdToken.uid });

    } catch (error) {
        console.error('Error creating session cookie:', error);
        // Handle specific errors (e.g., invalid token)
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return json({ error: 'Invalid or expired ID token.' }, { status: 401 });
        }
        return json({ error: 'Internal server error.' }, { status: 500 });
    }
} 