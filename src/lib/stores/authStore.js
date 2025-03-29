import { writable } from 'svelte/store';
import { auth } from '../firebase'; // Adjust path if your firebase.js is elsewhere
import { 
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    getIdToken 
} from "firebase/auth";

export const authStore = writable({
    // We keep client-side user for convenience (e.g., getting token quickly),
    // but server-verified state will come from layout data.
    user: null, 
    loading: true, 
    // data: {} // Removed, as user-specific data should be loaded via server load functions
});

let initialLoad = true; // Flag to manage initial auth check

// Function to set the session cookie via API call
async function setSessionCookie(firebaseUser) {
    if (!firebaseUser) return;
    try {
        const idToken = await getIdToken(firebaseUser);
        const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken })
        });
        if (!response.ok) {
            console.error('Failed to set session cookie:', await response.text());
            // Optionally sign out the user client-side if server session fails
            await signOut(auth);
        } else {
            console.log('Session cookie set successfully via API.');
        }
    } catch (error) {
        console.error('Error calling /api/auth/session:', error);
         // Optionally sign out the user client-side if server session fails
         await signOut(auth);
    }
}

// Function to clear the session cookie via API call
async function clearSessionCookie() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST' 
        });
         if (!response.ok) {
            console.error('Failed to clear session cookie:', await response.text());
        } else {
            console.log('Session cookie cleared successfully via API.');
        }
    } catch (error) {
        console.error('Error calling /api/auth/logout:', error);
    }
}

export const authHandlers = {
    signup: async (email, password) => {
        try {
            // createUserWithEmailAndPassword automatically signs the user in
            // The onAuthStateChanged listener below will handle setting the cookie
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Signup error:", error);
            throw error; 
        }
    },
    login: async (email, password) => {
        try {
            // signInWithEmailAndPassword triggers onAuthStateChanged
            // The listener below will handle setting the cookie
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    },
    logout: async () => {
        try {
            // First, sign out the user from the client-side Firebase SDK
            await signOut(auth);
            // Then, clear the server-side session cookie via API
            // Note: onAuthStateChanged will also fire with null user, calling clearSessionCookie again, which is fine.
            await clearSessionCookie(); 
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        }
    }
};

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed. User:', user ? user.uid : null);
    authStore.update((store) => ({ ...store, user: user }));

    if (user) {
        // User is signed in (or was already signed in).
        // Get the ID token and send it to the server to create/update the session cookie.
        await setSessionCookie(user);
    } else {
        // User is signed out.
        // Clear the server-side session cookie.
        // Avoid clearing during initial load if user was never logged in.
        if (!initialLoad) { 
            await clearSessionCookie();
        }
    }
    
    // Update loading state only after the first check completes
    if (initialLoad) {
        authStore.update((store) => ({ ...store, loading: false }));
        initialLoad = false;
        console.log('Initial auth check complete.');
    }
}); 