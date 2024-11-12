"use client"; 
import Image from "next/image";
import Script from "next/script";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.app}> 
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" />
 {/* Changed class name to styles.app */}
      <div className={styles.loginPage}> {/* Changed class name to styles.loginPage */}
      <title>Ice Cream Van</title>
        <img src="https://i.imgur.com/SvGSF6I.png" alt="Logo" className={styles.loginPageLogo} /> 
        <h2>Ice Cream Van</h2>
        <br />
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