import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDSbAaqLW8kTTL7NqRRasuv9dIetXBDY-c",
    authDomain: "to-do-list-f6681.firebaseapp.com",
    projectId: "to-do-list-f6681",
    storageBucket: "to-do-list-f6681.firebasestorage.app",
    messagingSenderId: "1010540282474",
    appId: "1:1010540282474:web:9a7e8812df8eb155f5c013",
    measurementId: "G-39NR238ZS7"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
