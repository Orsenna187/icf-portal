import { json } from '@sveltejs/kit';
import { getAdminAuth } from '$lib/server/admin';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	console.log('Session login endpoint hit');
	const { idToken } = await request.json();

	if (!idToken) {
		console.error('Session login: No ID token provided');
		return json({ error: 'ID token is required.' }, { status: 400 });
	}

	try {
		// Set session expiration to 5 days. Use the function here
		const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
		const adminAuth = getAdminAuth(); // Get the auth instance
		const decodedIdToken = await adminAuth.verifyIdToken(idToken);
		const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

		console.log('Session login: Cookie created successfully');

		// Set cookie policy options
		const options = { 
			maxAge: expiresIn / 1000, // maxAge is in seconds
			httpOnly: true, 
			secure: true, // Use true in production
			path: '/', 
			// sameSite: 'lax' // or 'strict' or 'none' depending on your needs
		};

		// Set cookie in the response headers
		const response = json({ status: 'success' }, { status: 200 });
		response.headers.set('Set-Cookie', `session=${sessionCookie}; Max-Age=${options.maxAge}; Path=${options.path}; HttpOnly; Secure; SameSite=Lax`); // Combine options manually
		
		return response;

	} catch (error) {
		console.error('Session login error:', error);
		return json({ error: 'Failed to create session cookie.', details: error.message }, { status: 401 });
	}
} 