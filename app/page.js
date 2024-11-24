"use client";
import Image from "next/image";
import Script from "next/script";
import styles from "./page.module.css";
import Head from 'next/head';
import { initializeApp } from "firebase/app";
import firebaseConfig from '../firebaseConfig.js';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function Home() {

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const user = result.user;
            console.log(user); 
            // You can access user.uid, user.displayName, user.email, etc.
            
            // TODO: Store user data in your database or state management solution

            window.location.href = "/app"; 
        } catch (error) {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.customData.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            console.error("Error signing in with Google:", error);
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
                <button onClick={signInWithGoogle} className={styles.loginButton}>Sign in with Google</button>
                <br />
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