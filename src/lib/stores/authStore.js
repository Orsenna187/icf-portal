import { writable } from 'svelte/store';
import { auth } from '../firebase'; // Adjust path if your firebase.js is elsewhere
import { 
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "firebase/auth";

export const authStore = writable({
    user: null,
    loading: true,
    data: {}
});

export const authHandlers = {
    signup: async (email, password) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Signup error:", error);
            // Handle signup errors (e.g., display message to user)
            throw error; // Re-throw error for component handling
        }
    },
    login: async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Login error:", error);
            // Handle login errors (e.g., invalid credentials)
            throw error;
        }
    },
    logout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout error:", error);
            // Handle logout errors
            throw error;
        }
    }
};

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        authStore.update((store) => ({
            ...store,
            user: user,
            loading: false,
            // You might want to fetch additional user data from Firestore here
            // data: { ...fetchedUserData }
        }));
    } else {
        authStore.update((store) => ({
            ...store,
            user: null,
            loading: false,
            data: {}
        }));
    }
}); 