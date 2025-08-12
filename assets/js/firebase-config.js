// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyApC6w8eQG33CzDl5hyYxlKVm7drXBDQ_o",
  authDomain: "redbiz-a2f1f.firebaseapp.com",
  projectId: "redbiz-a2f1f",
  storageBucket: "redbiz-a2f1f.appspot.com", // Corrected storage bucket domain
  messagingSenderId: "981962676587",
  appId: "1:981962676587:web:d3ce01c1686e0a1f68942e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
