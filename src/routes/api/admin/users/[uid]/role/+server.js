import { json, error } from '@sveltejs/kit';
import { getAdminAuth } from '$lib/server/admin';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies, params }) {
    const { uid } = params; // Get the target user's UID from the URL
    console.log(`API: POST /api/admin/users/${uid}/role`);
    
    let adminAuth;
    let requestingUserClaims;
    let newRole;

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
        throw error(401, 'Unauthorized: Invalid session cookie.');
    }

    // 2. Check if the requesting user is an admin
    if (requestingUserClaims.role !== 'admin') {
        console.warn('API: Non-admin user attempted to change user role.');
        throw error(403, 'Forbidden: You do not have permission to perform this action.');
    }

    // 3. Get the new role from the request body
    try {
        const body = await request.json();
        newRole = body.role;
        if (!newRole || typeof newRole !== 'string') {
             throw error(400, 'Bad Request: Missing or invalid \'role\' in request body.');
        }
         // Basic validation for allowed roles (customize as needed)
        const allowedRoles = ['admin', 'user']; // Example roles
        if (!allowedRoles.includes(newRole)) {
            throw error(400, `Bad Request: Invalid role \'${newRole}\'. Allowed roles are: ${allowedRoles.join(', ')}`);
        }
        console.log(`API: Attempting to set role to \'${newRole}\' for user UID: ${uid}`);

    } catch (err) {
        // Handle JSON parsing errors or validation errors
        if (err.status) { // If it's an error thrown by `error()`
             throw err;
        } else {
             console.error('API: Error parsing request body:', err);
             throw error(400, 'Bad Request: Invalid request body.');
        }
    }

    // 4. Set the custom claim for the target user
    try {
        // Optional: Prevent admin from accidentally removing their own admin role?
        // if (requestingUserClaims.uid === uid && newRole !== 'admin') {
        //     throw error(400, 'Bad Request: Admins cannot remove their own admin role.');
        // }

        // Retrieve existing claims to preserve any others
        const targetUserRecord = await adminAuth.getUser(uid);
        const existingClaims = targetUserRecord.customClaims || {};

        // Set the new role claim
        await adminAuth.setCustomUserClaims(uid, { ...existingClaims, role: newRole });

        console.log(`API: Successfully set role to \'${newRole}\' for user UID: ${uid}`);
        return json({ success: true, uid: uid, newRole: newRole });

    } catch (err) {
        console.error(`API: Error setting custom claims for user ${uid}:`, err);
        // Provide more specific error messages if possible
        if (err.code === 'auth/user-not-found') {
            throw error(404, `Not Found: User with UID ${uid} not found.`);
        }
        throw error(500, 'Internal Server Error: Failed to set user role.');
    }
} 