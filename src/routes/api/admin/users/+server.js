import { json, error } from '@sveltejs/kit';
import { getAdminAuth } from '$lib/server/admin';

/** @type {import('./$types').RequestHandler} */
export async function GET({ cookies }) {
    console.log('API: GET /api/admin/users');
    let adminAuth;
    let requestingUserClaims;

    // 1. Verify the session cookie and get the requesting user's claims
    try {
        const sessionCookie = cookies.get('session');
        if (!sessionCookie) {
            throw error(401, 'Unauthorized: No session cookie found.');
        }
        adminAuth = getAdminAuth();
        requestingUserClaims = await adminAuth.verifySessionCookie(
            sessionCookie, true /** checkRevoked */
        );
        console.log('API: Requesting user UID:', requestingUserClaims.uid);

    } catch (err) {
        console.error('API: Error verifying session cookie:', err);
        // Use the error utility for proper HTTP responses
        throw error(401, 'Unauthorized: Invalid session cookie.');
    }

    // 2. Check if the requesting user is an admin
    if (requestingUserClaims.role !== 'admin') {
        console.warn('API: Non-admin user attempted to access admin users list.');
        throw error(403, 'Forbidden: You do not have permission to access this resource.');
    }

    // 3. If admin, fetch all users
    try {
        console.log('API: Fetching list of users...');
        const listUsersResult = await adminAuth.listUsers(1000); // Fetch up to 1000 users

        const usersData = listUsersResult.users.map(userRecord => ({
            uid: userRecord.uid,
            email: userRecord.email,
            role: userRecord.customClaims?.role || 'user', // Default to 'user' if no role claim
            disabled: userRecord.disabled,
            lastSignInTime: userRecord.metadata.lastSignInTime,
            creationTime: userRecord.metadata.creationTime
        }));
        
        console.log(`API: Found ${usersData.length} users.`);
        return json(usersData);

    } catch (err) {
        console.error('API: Error listing users:', err);
        throw error(500, 'Internal Server Error: Failed to list users.');
    }
} 