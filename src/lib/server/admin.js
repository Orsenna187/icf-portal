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

    let credentials;
    
    try {
        // For Vercel: Check if service account is provided as JSON string in environment variable
        if (process.env.FIREBASE_ADMIN_SDK_CONFIG) {
            console.log('Using FIREBASE_ADMIN_SDK_CONFIG environment variable');
            const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG);
            credentials = cert(serviceAccount);
        }
        // For local dev: Try to load from file
        else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            console.log(`Attempting to read credentials from file: ${credentialsPath}`);
            const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
            credentials = cert(serviceAccount);
        } 
        // Direct file path fallback
        else {
            const credentialsPath = 'C:/Users/AAD947/Desktop/code/svelte/icf-portal/firebase-admin-key.json';
            console.log(`Fallback: Trying direct file path: ${credentialsPath}`);
            const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
            credentials = cert(serviceAccount);
        }

        // Initialize Firebase Admin SDK
        initializeApp({
            credential: credentials
        });
        console.log('Firebase Admin SDK initialized successfully.');
        return admin.auth(); // Return the newly initialized auth instance
    } catch (e) {
        console.error(`Error with Firebase Admin SDK initialization:`, e);
        throw new Error(`Failed to initialize Firebase Admin SDK: ${e.message}`);
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