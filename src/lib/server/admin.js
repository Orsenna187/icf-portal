import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Check if running in Vercel or locally
const serviceAccountJson = process.env.FIREBASE_ADMIN_SDK_CONFIG;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

let credentials;

if (serviceAccountJson) {
    try {
        // Used in Vercel - parse the JSON from the environment variable
        credentials = admin.credential.cert(JSON.parse(serviceAccountJson));
        console.log('Firebase Admin SDK: Initializing with config from FIREBASE_ADMIN_SDK_CONFIG env var.');
    } catch (e) {
        console.error('Firebase Admin SDK: Error parsing FIREBASE_ADMIN_SDK_CONFIG:', e);
    }
} else if (credentialsPath) {
    try {
        // Used locally - use the path from GOOGLE_APPLICATION_CREDENTIALS
        credentials = admin.credential.cert(credentialsPath);
        console.log(`Firebase Admin SDK: Initializing with credentials file from GOOGLE_APPLICATION_CREDENTIALS path: ${credentialsPath}`);
    } catch (e) {
        console.error(`Firebase Admin SDK: Error reading credentials file from ${credentialsPath}:`, e);
    }
} else {
    console.warn('Firebase Admin SDK: Credentials not found. Set FIREBASE_ADMIN_SDK_CONFIG (Vercel) or GOOGLE_APPLICATION_CREDENTIALS (local).');
}

// Initialize Firebase Admin SDK only once
if (!getApps().length) {
    if (credentials) {
        admin.initializeApp({
            credential: credentials
        });
        console.log('Firebase Admin SDK initialized successfully.');
    } else {
        console.error('Firebase Admin SDK: Initialization failed due to missing credentials.');
    }
} else {
    console.log('Firebase Admin SDK already initialized.');
}

export const adminAuth = admin.auth();
// export const adminDb = admin.firestore(); // Uncomment if you need server-side DB access
// export const adminStorage = admin.storage(); // Uncomment if you need server-side Storage access 