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
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
