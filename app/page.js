"use client";
import Image from "next/image";
import Script from "next/script";
import styles from "./page.module.css";
import Head from 'next/head';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

let firebaseConfig;

if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
  //firebaseConfig = await import('./firebaseConfig_local.js').then(module => module.default);
} else {
  firebaseConfig = await import('./firebaseConfig.js').then(module => module.default);
}



const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Export auth
const provider = new GoogleAuthProvider();

export default function Home() {

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      console.log(user);

      
      window.location.href = "/map";
      

      // You can access user.uid, user.displayName, user.email, etc.

      // TODO: Store user data in your database or state management solution

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
      <div className={styles.loginPage}>

        <Head>
          <title>Ice Cream Van</title>
          <link rel="icon" href="/logo_nobg.ico" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        </Head>

        <img src="https://i.imgur.com/SvGSF6I.png" alt="Logo" className={styles.loginPageLogo} />
        <h2>Ice Cream Van</h2>
        <br />
        
        <input type="text" id="username" placeholder="Username" className={styles.inputField} />
        <input type="password" id="password" placeholder="Password" className={styles.inputField} />
        <button onClick={login} className={styles.loginButton} style={{ backgroundColor: 'grey' }} disabled>Login</button>
        <hr className={styles.separator} /> {/* Separator line */}
        <button onClick={signInWithGoogle} className={styles.loginButton}>Sign in with Google</button>
        <button onClick={guestLogin} className={styles.loginButton}>Sign in as Guest</button>
        <br />
      </div>
    </div>
  );
}

function login() {
  // ... (Authentication logic)
  window.location.href = "/welcome";
}


async function guestLogin() {
  try {
    window.location.href = "/map";
  } catch (error) {
    console.error("Error signing in anonymously:", error);
  }
}