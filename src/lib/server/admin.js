import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import fs from 'fs';

let adminAuthInstance = null;

const initializeAdminApp = () => {
    console.log('Attempting Firebase Admin SDK initialization...');

    // Check if already initialized by looking at the apps array
    if (getApps().length) {
        console.log('Firebase Admin SDK already initialized.');
        return admin.auth(); // Return existing auth instance
    }

    // Check if running in Vercel or locally
    const serviceAccountJson = process.env.FIREBASE_ADMIN_SDK_CONFIG;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    let credentials;

    if (serviceAccountJson) {
        try {
            credentials = cert(JSON.parse(serviceAccountJson));
            console.log('Using credentials from FIREBASE_ADMIN_SDK_CONFIG env var.');
        } catch (e) {
            console.error('Error parsing FIREBASE_ADMIN_SDK_CONFIG:', e);
            throw new Error('Failed to initialize Firebase Admin SDK (JSON parse error).');
        }
    } else if (credentialsPath) {
        try {
            const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8')); // Specify encoding
            credentials = cert(serviceAccount);
            console.log(`Using credentials file from GOOGLE_APPLICATION_CREDENTIALS path: ${credentialsPath}`);
        } catch (e) {
            console.error(`Error reading/parsing credentials file from ${credentialsPath}:`, e);
            throw new Error('Failed to initialize Firebase Admin SDK (File read/parse error).');
        }
    } else {
        console.warn('Credentials not found. Set FIREBASE_ADMIN_SDK_CONFIG or GOOGLE_APPLICATION_CREDENTIALS.');
        throw new Error('Failed to initialize Firebase Admin SDK (Missing credentials).');
    }

    // Initialize Firebase Admin SDK
    try {
        initializeApp({
            credential: credentials
        });
        console.log('Firebase Admin SDK initialized successfully.');
        return admin.auth(); // Return the newly initialized auth instance
    } catch (initError) {
        console.error('Firebase Admin SDK: Error during initializeApp:', initError);
        throw new Error('Firebase Admin SDK initialization failed.');
    }
};

// Export a function that gets or initializes the auth instance
export const getAdminAuth = () => {
    if (!adminAuthInstance) {
        // If not initialized yet, call the initialization function
        adminAuthInstance = initializeAdminApp();
    }
    // Return the instance (either newly created or existing)
    return adminAuthInstance;
};

// Old export (remove or comment out)
// export const adminAuth = admin.auth();

// export const adminDb = admin.firestore(); // Uncomment if you need server-side DB access
// export const adminStorage = admin.storage(); // Uncomment if you need server-side Storage access 