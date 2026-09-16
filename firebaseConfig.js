// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBYdhu050qJiEAw4yz1heNPTEOwng6GeZs",
  authDomain: "umatch-cc8cc.firebaseapp.com",
  projectId: "umatch-cc8cc",
  storageBucket: "umatch-cc8cc.firebasestorage.app",
  messagingSenderId: "229374367464",
  appId: "1:229374367464:web:3eee2d717f98080e741b5d",
  measurementId: "G-8F2C3FPW7J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);