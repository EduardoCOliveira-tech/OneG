// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyADqeAagVQzqVgZUwI7_5LaTMiDFen45PQ",
  authDomain: "oneg-project-26ff4.firebaseapp.com",
  projectId: "oneg-project-26ff4",
  storageBucket: "oneg-project-26ff4.firebasestorage.app",
  messagingSenderId: "692544465597",
  appId: "1:692544465597:web:50eb6c7de3a285359865d4"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };