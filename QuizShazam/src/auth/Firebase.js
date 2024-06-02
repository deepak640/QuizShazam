// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAP1Ngd4mZw12g3l33moXsfcnwvU889o1s",
  authDomain: "quizshazam.firebaseapp.com",
  projectId: "quizshazam",
  storageBucket: "quizshazam.appspot.com",
  messagingSenderId: "984615765846",
  appId: "1:984615765846:web:98d7ded1570c1bfebff8f7",
  measurementId: "G-RMBPYL1Q75",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
