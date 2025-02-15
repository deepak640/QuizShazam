// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
const {
  VITE_REACT_AK,
  VITE_REACT_DOMAIN,
  VITE_REACT_PROJECT_NAME,
  VITE_REACT_API_BUCKET,
  VITE_REACT_MESSAGE,
  VITE_REACT_APPID,
  VITE_REACT_ID,
} = import.meta.env;
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: VITE_REACT_AK,
  authDomain: VITE_REACT_DOMAIN,
  projectId: VITE_REACT_PROJECT_NAME,
  storageBucket: VITE_REACT_API_BUCKET,
  messagingSenderId: VITE_REACT_MESSAGE,
  appId: VITE_REACT_APPID,
  measurementId: VITE_REACT_ID,
  // apiKey: "AIzaSyCAtJkO_oYSmJsSl17g7uZ84nyPa7lj37I",

  // authDomain: "bazario-79ecc.firebaseapp.com",

  // projectId: "bazario-79ecc",

  // storageBucket: "bazario-79ecc.firebasestorage.app",

  // messagingSenderId: "152291991640",

  // appId: "1:152291991640:web:e8bfa7923f9f6f2d7bea2d",

  // measurementId: "G-KFMQV7ML3W"
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
