import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCssc6ZuUhu7qNdaSIkYC0jwQmH9dwfDqY",
  authDomain: "gerenciador-de-notas-60267.firebaseapp.com",
  projectId: "gerenciador-de-notas-60267",
  storageBucket: "gerenciador-de-notas-60267.firebasestorage.app",
  messagingSenderId: "821406454738",
  appId: "1:821406454738:web:f75ca9793b2e8d4b10ae0b",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
