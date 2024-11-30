// ./welcome/page.js
"use client";

import { useState, useEffect, useRef  } from "react";
import styles from "../page.module.css";
import Head from "next/head";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDocs, setDoc, GeoPoint } from "firebase/firestore";
import {
  getDoc, // Import getDoc
  updateDoc // Import updateDoc
} from "firebase/firestore";

let firebaseConfig;

if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
  firebaseConfig = await import('../firebaseConfig_local.js').then(module => module.default);
} else {
  firebaseConfig = await import('../firebaseConfig.js').then(module => module.default);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function WelcomePage() {
  const [user, setUser] = useState(null);
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(1);
  const [hasVan, setHasVan] = useState(false);
  const [vanName, setVanName] = useState("");
  const [selectedVanIcon, setSelectedVanIcon] = useState(1);
  const [userData, setUserData] = useState(null);
  const [showAccountDetails, setshowAccountDetails] = useState(false); // State to control visibility

  const hasVanRef = useRef(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Set the checkbox state after the component has rendered
       

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
     

      if (!userDoc.exists()) {
        console.log("Account does not exist, create account!!");

        const userData = {
          userID: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          profilePicture: selectedProfilePicture,
          vanIcon: selectedVanIcon,
          vanName: vanName,
          firstLogin: true,
          isVan: hasVan,
          location: new GeoPoint(0, 0), // Add location field here
        };

        await setDoc(userDocRef, userData);

      } else {
        console.log("Account already exists!!");
        const userData = userDoc.data();
        console.log("User Data:", userData);
        console.log("Has Van = " + userData.hasVan);

         // Set the checkbox state after getting data and updating state
         console.log("HasVan element grabbed? : " + hasVanRef.current);
      

        // Update state variables individually
        setSelectedProfilePicture(userData.profilePicture);
        setSelectedVanIcon(userData.vanIcon);
        setVanName(userData.vanName);
        setHasVan(userData.isVan);
        
      

         // Set the checkbox state after getting data 
    if (hasVanRef.current) {
      hasVanRef.current.checked = userData.hasVan;
      if(userData.hasVan)
      {
        handleVanCheckboxChange();
      }
      console.log("TICKING THE BOX!");
    }
        
      }

    } catch (error) {
      console.log("Error checking/creating user document:", error);
      alert("Error checking/saving data. Please try again.");
    }

  } else {
    window.location.href = "/";
  }
    });

return () => unsubscribeAuth();
  }, []);



const handleProfilePictureClick = (index) => {
  setSelectedProfilePicture(index);
};

const handleVanCheckboxChange = () => {
  setHasVan(!hasVan);
};

const handleVanNameChange = (event) => {
  setVanName(event.target.value);
};

const handleVanIconClick = (index) => {
  setSelectedVanIcon(index);
};

const backToMap = (index) => {
  window.location.href = "/map";
};

const logout = () => {
  auth.signOut()
    .then(() => {
      console.log("User signed out");
      window.location.href = "/";
    })
    .catch((error) => {
      console.error("Error signing out:", error);
      setBannerMessage("Error signing out. Please try again.");
      setBannerType('sticky');
    });
};

const handleSubmit = async () => {
  try {
    if (hasVan && vanName.trim() === "") {
      alert("Please enter a van name.");
      return;
    }

    const userDocRef = doc(db, "users", user.uid);

    const userData = {
      userID: user.uid,
      displayName: user.displayName, // Add displayName
      email: user.email,           // Add email
      profilePicture: selectedProfilePicture,
      hasVan: hasVan,
      vanName: vanName,
      vanIcon: selectedVanIcon,
      active: false,
      firstLogin: false,
      location: new GeoPoint(0, 0), // Add the location field
    };

    await updateDoc(userDocRef, userData); // Use updateDoc to update

    window.location.href = "/map";
  } catch (error) {
    console.log("Error updating user data:", error);
    alert("Error saving data. Please try again.");
  }
};

return (
  <div className={styles.app}>
    <Head>
      <title>Welcome</title>
      <link rel="icon" href="/logo_nobg.ico" />
    </Head>

    <div className={styles.loginPage}>
      {user && (
        <h2>Welcome {user.displayName.split(' ')[0]}!</h2>
      )}

      {/* Large Profile Picture */}
      <img
        src={`/images/profile-pics/${selectedProfilePicture}.jpg`} // Make sure the path is correct
        alt="Selected Profile"
        className={styles.largeProfilePicture}
      />

      {/* Profile Picture Selection */}
      <div className={styles.profilePictureContainer}>
        {[1, 2, 3, 4, 5].map((index) => (
          <img
            key={index}
            src={`/images/profile-pics/${index}.jpg`} // Make sure the path is correct
            alt={`Profile ${index}`}
            className={`${styles.profilePicture} ${selectedProfilePicture === index ? styles.selected : ""
              }`}
            onClick={() => handleProfilePictureClick(index)}
          />
        ))}
      </div>

      <hr className={styles.separator} /> {/* Separator line */}
      {/* Ice Cream Van Section */}
      <div className={styles.iceCreamVanCheckbox}>
        <input
          type="checkbox"
          id="hasVan"
          ref={hasVanRef} 
          checked={hasVan}
          onChange={handleVanCheckboxChange}
        />
        <label htmlFor="hasVan"> I deliver ice cream to the people</label>
      </div>


      {hasVan && (
        <div>
          <label style={{ fontSize: '12px' }} htmlFor="hasVan">Van Details</label>
          <input
            type="text"
            id="vanName"
            placeholder="Van Name"
            className={styles.inputField}
            value={vanName}
            onChange={handleVanNameChange}
          />
<br/>

          <div className={styles.vanIconContainer}>
            {[1, 2, 3, 4].map((index) => (
              <img
                key={index}
                src={`/images/vans/${index}.png`}
                alt={`Van ${index}`}
                className={`${styles.vanIcon} ${selectedVanIcon === index ? styles.selected : ""
                  }`}
                onClick={() => handleVanIconClick(index)}
              />
            ))}
          </div>
        </div>
      )}
         <br />

{(user && showAccountDetails) && (
      <div onClick={() => setshowAccountDetails(!showAccountDetails)} className={styles.userDetails}>        
        <p>User ID: {user.uid}</p>
        <p>Name: {user.displayName}</p>
        <p>Email: {user.email}</p>
      </div>
    )}
   
    <hr className={styles.separator} /> {/* Separator line */}
    {(user && !showAccountDetails) && (
    <button onClick={() => setshowAccountDetails(!showAccountDetails)} className={styles.loginButton}>
        Account Details
      </button>
    )}

      {!userData?.firstLogin && ( 
      <button onClick={backToMap} className={styles.loginButton}>
        Back to Map
      </button>
      )}

      <button onClick={handleSubmit} className={styles.loginButton}>
        Save
      </button>
      <hr className={styles.separator} /> {/* Separator line */}
      <button onClick={logout} className={styles.settingsButton} style={{ backgroundColor: '#A52A2A' }}>Logout</button>
    
    </div>

    
    
  </div>
);
}