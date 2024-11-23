"use client";
import Image from "next/image";
import Script from "next/script";
import styles from "./page.module.css";
import Head from 'next/head';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebaseConfig.js'; // Import your Firebase config

export default function Home() {

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Redirect or update state after successful sign-in (e.g., redirect to /map)
      window.location.href = "/map"; 
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.app}>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" />
      <div className={styles.loginPage}>
        <Head>
          <title>Ice Cream Van</title>
        </Head>
        <img src="https://i.imgur.com/SvGSF6I.png" alt="Logo" className={styles.loginPageLogo} />
        <h2>Ice Cream Van</h2>
        <br />
        <br />

        {/* Google Sign-In Button */}
        <button onClick={signInWithGoogle} className={styles.loginButton}>
          Sign in with Google
        </button>

        <input type="text" id="username" placeholder="Username" className={styles.inputField} />
        <input type="password" id="password" placeholder="Password" className={styles.inputField} />
        <button onClick={login} className={styles.loginButton}>Login</button>
        <br />
        <button onClick={guestLogin} className={styles.loginButton}>Login as Guest</button>
      </div>
    </div>
  );
}

function login() {
  // ... (Authentication logic)
  window.location.href = "/app";
}

function guestLogin() {
  // ... (Guest login logic)
  window.location.href = "/map";
}