// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: "interlinked-9a711.firebaseapp.com",
    projectId: "interlinked-9a711",
    storageBucket: "interlinked-9a711.firebasestorage.app",
    messagingSenderId: "767706755430",
    appId: "1:767706755430:web:731ddcd4f85f1a58c1d8a7",
    measurementId: "G-HPTN0ZKSMH"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage(app);