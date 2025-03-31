import { json, error } from '@sveltejs/kit';
import { getAdminAuth } from '$lib/server/admin';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
    console.log('API: POST /api/admin/users/create');
    
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
        throw error(401, 'Unauthorized: Invalid session cookie.');
    }

    // 2. Check if the requesting user is an admin
    if (requestingUserClaims.role !== 'admin') {
        console.warn('API: Non-admin user attempted to create a new user.');
        throw error(403, 'Forbidden: You do not have permission to perform this action.');
    }

    // 3. Get the new user data from the request body
    let email, password, role;
    try {
        const body = await request.json();
        email = body.email;
        password = body.password;
        role = body.role || 'user'; // Default to 'user' if no role specified
        
        if (!email || !password) {
            throw error(400, 'Bad Request: Email and password are required.');
        }
        
        // Basic validation for allowed roles
        const allowedRoles = ['admin', 'user'];
        if (!allowedRoles.includes(role)) {
            throw error(400, `Bad Request: Invalid role '${role}'. Allowed roles are: ${allowedRoles.join(', ')}`);
        }
        
        console.log(`API: Attempting to create new user with email: ${email}`);

    } catch (err) {
        // Handle JSON parsing errors or validation errors
        if (err.status) { // If it's an error thrown by `error()`
            throw err;
        } else {
            console.error('API: Error parsing request body:', err);
            throw error(400, 'Bad Request: Invalid request body.');
        }
    }

    // 4. Create the user using Firebase Admin SDK
    try {
        // Create the user account
        const userRecord = await adminAuth.createUser({
            email: email,
            password: password,
            emailVerified: false // By default, don't verify their email
        });
        
        console.log(`API: Successfully created new user with UID: ${userRecord.uid}`);
        
        // Set custom claims (role) for the new user
        await adminAuth.setCustomUserClaims(userRecord.uid, { role: role });
        console.log(`API: Successfully set role '${role}' for user UID: ${userRecord.uid}`);
        
        // Prepare response with user info
        const userData = {
            uid: userRecord.uid,
            email: userRecord.email,
            role: role,
            emailVerified: userRecord.emailVerified,
            disabled: userRecord.disabled,
            creationTime: userRecord.metadata.creationTime || new Date().toISOString()
        };
        
        return json({ 
            success: true, 
            message: 'User created successfully.',
            user: userData
        });

    } catch (err) {
        console.error('API: Error creating user:', err);
        
        // Provide more specific error messages for common Firebase auth errors
        if (err.code === 'auth/email-already-exists') {
            throw error(400, 'A user with that email already exists.');
        } else if (err.code === 'auth/invalid-email') {
            throw error(400, 'The email address is not valid.');
        } else if (err.code === 'auth/invalid-password') {
            throw error(400, 'The password must be at least 6 characters long.');
        } else {
            throw error(500, `Internal Server Error: ${err.message}`);
        }
    }
} 