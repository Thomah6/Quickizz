import { auth } from './firebase-config.js';
import { findOrCreateUserProfile } from './firestore.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const user = result.user;
            console.log("User signed in: ", user);
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = error.customData.email;
            const credential = GoogleAuthProvider.credentialFromError(error);
            console.error("Login failed: ", errorMessage);
        });
};

export const signOutUser = () => {
    signOut(auth).then(() => {
        console.log("User signed out.");
    }).catch((error) => {
        console.error("Sign out failed: ", error);
    });
};

export const authStateObserver = (callback) => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            findOrCreateUserProfile(user);
        }
        callback(user);
    });
};
