// app/map/page.js
"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import Head from "next/head";

import 'leaflet/dist/leaflet.css';


let firebaseConfig;

if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
  //firebaseConfig = await import('../firebaseConfig_local.js').then(module => module.default);
} else {
  firebaseConfig = await import('../firebaseConfig.js').then(module => module.default);
}


import { doc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "../page"; // Import auth from page.js

export default function MapPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(true);
  const [isLocationOn, setIsLocationOn] = useState(false);
  const [user, setUser] = useState(null);
  const [bannerMessage, setBannerMessage] = useState(null);
  const [bannerType, setBannerType] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  const [currentLocation, setCurrentLocation] = useState(null); 
  const [map, setMap] = useState(null);
  const [myLocationCircle, setMyLocationCircle] = useState(null);


  const cicle_Color = '#CD506D';
  const circle_fillColor = '#75ac9f';
  const circle_fillOpacity = 0.4;
  const circle_radius = 1500;

  let circleSpawned = false;

  // Function to get the current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          setCurrentLocation([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          setBannerMessage("Error getting your location");
          setBannerType('timed');
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setBannerMessage("Geolocation is not supported");
      setBannerType('timed');
    }
  };

  // Function to update the map with the current location
  const updateMapLocation = () => {
    if (map && currentLocation) {
      map.setView(currentLocation, 13); 

      if (myLocationCircle) {
        // Move the existing circle to the new location
        myLocationCircle.setLatLng(currentLocation);
      } else {
        // Create the circle initially
        const newCircle = L.circle(currentLocation, {
          color: cicle_Color,
          fillColor: circle_fillColor,
          fillOpacity: circle_fillOpacity,
          radius: circle_radius
        }).addTo(map);
        setMyLocationCircle(newCircle); // Now you can use setMyLocationCircle
      }
    }
  };

  // Get location on button click
  const manuallyGetLocation = () => {
    getCurrentLocation(); 
  };


  useEffect(() => {

    let myLocationCircle;

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const analytics = getAnalytics(app);

    // Hide loading screen after X seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3300);

    // Initialize map after X seconds
    let mapInitialized = false;
    const timer_short = setTimeout(() => {
      if (!mapInitialized) {
        initMap();
        mapInitialized = true;
      }
    }, 3000);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // Check if the user is a guest 
      if (currentUser && currentUser.isAnonymous) {
        setIsGuest(true);
        setBannerMessage("Logged in as Guest.");
        setBannerType('sticky');
      } else {
        setIsGuest(false);
        setBannerMessage(''); 
        setBannerType('');
      }
    });

    return () => {
      clearTimeout(timer);
      clearTimeout(timer_short);
      unsubscribeAuth(); 
    };

    async function initMap() {
      console.log("CREATING MAP");
      const L = await import("leaflet"); 

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

      // CREATE THE MAP - use currentLocation if available, otherwise [0, 0]
      const map = L.map("map").setView(currentLocation || [0, 0], 13); 
      setMap(map);

    

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

              // Use user.uid to identify the current user's van
              if (user.userID === auth.currentUser.uid) { 
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

  // Get initial location when the component mounts
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Update map whenever the currentLocation changes
  useEffect(() => {
    updateMapLocation();
  }, [currentLocation, map]); 

  const toggleSettings = () => {
    const settingsPanel = document.getElementById("settingsPanel");
    settingsPanel.style.display =
      settingsPanel.style.display === "none" ? "block" : "none";
  };

  const updateMyRoute = () => {
    // ... (Implementation for updating route)
  };

  const getMyLocation = () => {
    manuallyGetLocation();
    toggleSettings();
  };

  const toggleLocation = async () => {
    try {
      setIsLocationOn(!isLocationOn);

      // Use user.uid to get the user's ID
      if (user && user.uid) {
        const userDocRef = doc(db, 'users', user.uid); 

        await updateDoc(userDocRef, {
          active: !isLocationOn,
        });
      } else {
        console.error("User not logged in or ID not available");
        // Handle the error appropriately, e.g., show a message to the user
      }

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
        setBannerMessage("Error signing out. Please try again.");
        setBannerType('sticky');
      });
  };

  const closeBanner = () => {
    setBannerMessage(null);
    setBannerType(null);
  };

  useEffect(() => {
    let timer;
    if (bannerType === 'timed' && bannerMessage) {
      timer = setTimeout(() => {
        closeBanner();
      }, 5000); // 5 seconds
    }

    return () => clearTimeout(timer);
  }, [bannerMessage, bannerType]);


  return (
    <>
      <Head>
        <title>Ice Cream Van</title>
        <link rel="icon" href="/logo_nobg.ico" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      </Head>

      {isLoading && (
        <div className={styles.loadingScreen}>
          <img src="https://i.imgur.com/SvGSF6I.png" alt="Logo" className={styles.loginPageLogo} />
          <p>Searching for ice cream trucks...</p>
        </div>
      )}


      {(bannerMessage && isGuest) && (
        <div className={styles.banner} style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000000000000000 }}>
          <div className={styles.bannerMessage}>{bannerMessage}</div>
          {bannerType === 'sticky' && (
            <button className={styles.bannerClose} onClick={closeBanner}>
              X
            </button>
          )}
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

          {user && ( 
            <div className={styles.loginDetailsContainer}>
              <div className={styles.loggedInAs}>Logged in as:</div>
              <div className={styles.userName}>{user.displayName}</div>
            </div>
          )}
        </div>

        <div id="settingsPanel" style={{ display: "none" }}>
         
           
            <button onClick={getMyLocation} className={styles.settingsButton}>Get Location</button>  
       
            {isOwner && (
              <button onClick={toggleLocation} className={styles.settingsButton}>
                {isLocationOn ? "Turn Off Location" : "Turn On Location"}
              </button>
            )}

            {isOwner && (
              <button onClick={updateMyRoute} className={styles.settingsButton} style={{ backgroundColor: 'darkgrey' }} disabled>My Route</button>
            )}

            <button onClick={logout} className={styles.settingsButton} style={{ backgroundColor: '#A52A2A' }}>Logout</button>
          

          <div id="settingsPanelGap" style={{ paddingBottom: "20px" }}>
          </div>
        </div>

        <div id="map" className={styles.mapContainer}></div>
        <div className={styles.createdBy}>Created by Zak Brindle</div>

        {user && ( 
          <div className={styles.userDetails}>
            <p>User ID: {user.uid}</p>
            <p>Name: {user.displayName}</p>
            <p>Email: {user.email}</p>
          </div>
        )}
      </div>
    </>
  );
}