import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBPMUPdJb2JHKdACVpIhQf3CyGMzeE6mVs",
    authDomain: "pest-control-system-393aa.firebaseapp.com",
    databaseURL: "https://pest-control-system-393aa-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pest-control-system-393aa",
    storageBucket: "pest-control-system-393aa.firebasestorage.app",
    messagingSenderId: "579240324253",
    appId: "1:579240324253:web:42de253d48aed3d995b874"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);