// app/map/page.js
"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import Head from "next/head";

import 'leaflet/dist/leaflet.css';
import firebaseConfig from '../firebaseConfig.js';

import { doc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function MapPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(true);
  const [isLocationOn, setIsLocationOn] = useState(false);
  const [user, setUser] = useState(null); // Add state for the user object

  let defaultLatitude = "53.765284407793764";
  let defaultLongitude = "-2.708824723749953";

  let blackburndefaultLatitude = "53.74328616942579";
  let blackburndefaultLongitude = "-2.493528328604127";

  let myLatitude = defaultLatitude;
  let myLongitude = defaultLongitude;

  // GET CURRENT LOCATION -------------------
  // ---------------------------------------
  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition);
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }

  function showPosition(position) {
    myLatitude = position.coords.latitude;
    myLongitude = position.coords.longitude;

    if (myLatitude !== null && myLongitude !== null) {
      console.log("Latitude: " + myLatitude + ", Longitude: " + myLongitude);
    } else {
      console.error("Latitude or longitude is null.");
    }
  }

  if (typeof window !== 'undefined') {
    const fetchUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            getLocation();
          },
          (error) => {
            console.log('Error getting user location:', error);
          }
        );
      }
    };

    fetchUserLocation();
  }
  // END OF GET CURRENT LOCATION --------------
  // ------------------------------------------

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const analytics = getAnalytics(app);
    const auth = getAuth(); // Get Auth instance

    // VAN NAME OLD CODE NO LONGER USED
    const vanNames = [
      "Scoop Dogg",
      "Lord of the Cones",
      "Game of Cones",
      "Sherlock Cones",
      "Sugar Rush Express",
      "Lickety-Split",
      "The Conefather",
      "The Dairy Godmother",
      "Diary of a Whippy Kidd"
    ];
    // // // //

    // Hide loading screen after X seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3300);

    // Initialize map after X seconds, but only if not already initialized
    let mapInitialized = false;
    const timer_short = setTimeout(() => {
      if (!mapInitialized) {
        initMap();
        mapInitialized = true;
      }
    }, 3000);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => { // Auth state listener
      setUser(currentUser);
    });

    return () => {
      clearTimeout(timer);
      clearTimeout(timer_short);
      unsubscribeAuth(); // Unsubscribe from auth state changes
    };

    async function initMap() {
      console.log("CREATING MAP");
      const L = await import("leaflet"); // Dynamically import Leaflet

      const myIcon = L.icon({
        iconUrl: './images/van.png',
        iconSize: [50, 50],
        iconAnchor: [22, 50],
        popupAnchor: [-3, -46]
      });

      const myIcon_me = L.icon({
        iconUrl: './images/van-me.png',
        iconSize: [50, 50],
        iconAnchor: [22, 50],
        popupAnchor: [-3, -46]
      });

      const map = L.map("map").setView([myLatitude, myLongitude], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      async function fetchUserData() {
        try {
          const usersRef = collection(db, 'users');
          const querySnapshot = await getDocs(usersRef);
          const vans = [];

          querySnapshot.forEach((doc) => {
            const userData = doc.data();
            const user = {
              longitude: userData.location._long,
              latitude: userData.location._lat,
              userName: userData.userName,
              active: userData.active,
              userID: userData.userID,
              isVan: userData.isVan
            };

            if (user.isVan && user.active) {
              vans.push(user);
            }
          });

          map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
              map.removeLayer(layer);
            }
          });

          console.log("Vans:", vans);

          vans.forEach((user) => {
            if (user.active) {
              console.log("CREATING VAN ON MAP: Lat (" + user.latitude + ") Long (" + user.longitude + ")");

              // Assuming userID_testing is replaced with the actual user ID
              if (user.userID === userID_testing) {
                L.marker([user.latitude, user.longitude], { icon: myIcon_me }).addTo(map).bindPopup(`<b>${user.userName}</b><br><a href="https://www.google.com/maps/dir/?api=1&destination=$${user.latitude},${user.longitude}&travelmode=walking" target="_blank">Directions</a>`);
              } else {
                L.marker([user.latitude, user.longitude], { icon: myIcon }).addTo(map).bindPopup(`<b>${user.userName}</b><br><a href="https://www.google.com/maps/dir/?api=1&destination=$${user.latitude},${user.longitude}&travelmode=walking" target="_blank">Directions</a>`);
              }
            }
          });
        } catch (error) {
          console.error("Error fetching van data:", error);
        }
      }

      fetchUserData();
      setInterval(fetchUserData, 60 * 1000);
    }
  }, []);

  const toggleSettings = () => {
    const settingsPanel = document.getElementById("settingsPanel");
    settingsPanel.style.display =
      settingsPanel.style.display === "none" ? "block" : "none";
  };

  const updateMyRoute = () => {
    // ... (Implementation for updating route)
  };

  const getMyLocation = () => {
    // ... (Implementation for getting current location)
  };

  const userID_testing = 1; // Replace with actual logged-in user ID later

  const toggleLocation = async () => {
    try {
      setIsLocationOn(!isLocationOn);

      const userDocRef = doc(db, 'users', userID_testing);

      await updateDoc(userDocRef, {
        active: !isLocationOn,
      });

    } catch (error) {
      console.error("Error toggling location:", error);
    }
  };

  const logout = () => {
    auth.signOut()
      .then(() => {
        console.log("User signed out");
        window.location.href = "/";
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };

  return (
    <>
      <Head>
        <title>Ice Cream Van</title>
        <link rel="icon" href="./logo_nobg.ico" /> 
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      </Head>

      {isLoading && (
        <div className={styles.loadingScreen}>
          <img src="https://i.imgur.com/SvGSF6I.png" alt="Logo" className={styles.loginPageLogo} />
          <p>Searching for ice cream trucks...</p>
        </div>
      )}

      <div className={styles.app}>
        <div className={styles.topBar}>
          <img
            src="./images/settings.png"
            alt="Settings"
            className={styles.settingsIcon}
            onClick={toggleSettings}
          />

          {user && ( // Conditionally render if user is logged in
            <div className={styles.loginDetailsContainer}>
              <div className={styles.loggedInAs}>Logged in as:</div>
              <div className={styles.userName}>{user.displayName}</div>{/* Display the user's name here*/}
            </div>
          )}


        </div>

        <div id="settingsPanel" style={{ display: "none" }}>
          <div className={styles.settingsPanelRow}>
            <button onClick={logout} className={styles.settingsButton} style={{ marginRight: "10px" }}>Logout</button>
            <button onClick={getMyLocation} className={styles.settingsButton} style={{ marginLeft: "10px" }}>Get Location</button>
          </div>

          <div className={styles.settingsPanelRow}>
            {isOwner && (
              <button onClick={toggleLocation} className={styles.settingsButton} style={{ marginRight: "10px" }}>
                {isLocationOn ? "Turn Off Location" : "Turn On Location"}
              </button>
            )}

            {isOwner && (
              <button onClick={updateMyRoute} className={styles.settingsButton} style={{ marginLeft: "10px" }}>My Route</button>
            )}
          </div>

          <div id="settingsPanelGap" style={{ paddingBottom: "20px" }}>
          </div>
        </div>

        <div id="map" className={styles.mapContainer}></div>
        <div className={styles.createdBy}>Created by Zak Brindle</div>


        {/* User details section (for testing) */}
        {user && ( // Conditionally render if user is logged in
          <div className={styles.userDetails}>
            <p>User ID: {user.uid}</p>
            <p>Name: {user.displayName}</p>
            <p>Email: {user.email}</p>
            {/* Add more details as needed */}
          </div>
        )}


      </div>
    </>
  );
}