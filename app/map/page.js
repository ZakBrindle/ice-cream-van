// app/map/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import styles from "../page.module.css";
import Head from "next/head";

import 'leaflet/dist/leaflet.css';

let firebaseConfig;

if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
 firebaseConfig = await import('../firebaseConfig_local.js').then(module => module.default);
} else {
  firebaseConfig = await import('../firebaseConfig.js').then(module => module.default);
}


import { doc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { GeoPoint } from "firebase/firestore";
import {
  getDoc, // Import getDoc
} from "firebase/firestore";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "../page"; // Import auth from page.js

export default function MapPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationOn, setIsLocationOn] = useState(false);
  const [user, setUser] = useState(null);
  const [bannerMessage, setBannerMessage] = useState(null);
  const [bannerType, setBannerType] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false); // State to control visibility

  const [currentLocation, setCurrentLocation] = useState(null);
  const [map, setMap] = useState(null);
  const [myLocationCircle, setMyLocationCircle] = useState(null);
  
  const [toggleVanIcon, setToggleVanIcon] = useState("./images/van-grey.png");


  const cicle_Color = '#CD506D';
  const circle_fillColor = '#75ac9f';
  const circle_fillOpacity = 0.4;
  const circle_radius = 1500;

  let circleSpawned = false;
  var loggedInBannerShown = false;


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
        setMyLocationCircle(newCircle);
      }
    }
  };

  // Get location on button click
  const manuallyGetLocation = () => {
    getCurrentLocation();
  };


  const updateLocationOnDatabase = async () => {
    try {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const userDocRef = doc(db, "users", user.uid);

      const userData = {
        location: new GeoPoint(currentLocation[0], currentLocation[1]),
      };

      await updateDoc(userDocRef, userData);
      console.log("Location saved to database:" + currentLocation);
    } catch (error) {
      console.error("Error updating user data:", error);
      console.log("Error saving location (" + currentLocation + ") to database. Please try again.");
    }
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }



      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);


        if (!userDoc.exists()) {
          console.log("Account does not exist, create account!!");
          window.location.href = "/welcome";
        }
      }
      catch (error) {
        console.log("Error checking/creating user document:", error);
        alert("Error checking/saving data. Please try again.");
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserData(userDoc.data());
          // Redirect if firstLogin is true
          if (userDoc.data().firstLogin) {
            window.location.href = "/welcome";
          }

          if(!loggedInBannerShown)
          {
            setBannerMessage("Logged in as " + userDoc.data().displayName);
            setBannerType('timed');
           loggedInBannerShown = true; 
          }

          // Check conditions for setting isLocationOn
          if (userDoc.data().hasVan && userDoc.data().active) {
            setIsLocationOn(true);
          }
        }
        else {
          window.location.href = "/welcome";
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      // Check if the user is a guest 
      if (currentUser && currentUser.isAnonymous) {
        setIsGuest(true);
        setBannerMessage("Logged in as Guest.");
        setBannerType('timed');
      } else {
        setIsGuest(false);
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



      const myIcon_me = L.icon({
        iconUrl: './images/van-me.png',
        iconSize: [50, 50],
        iconAnchor: [22, 50],
        popupAnchor: [-3, -46]
      });


      const myIcon_bw = L.icon({
        iconUrl: './images/van-bw.png',
        iconSize: [50, 50],
        iconAnchor: [22, 50],
        popupAnchor: [-3, -46]
      });

      const map = L.map("map").setView(currentLocation || [0, 0], 13);
      setMap(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);


      // ADD GET LOCATION PIN
      if (typeof window !== 'undefined') {
        L.Control.LocationPin = L.Control.extend({
          onAdd: function (map) {
            const div = L.DomUtil.create('div', 'location-pin-button');
            div.innerHTML = `<img src="./images/locationPin_button.png" alt="Get Location" />`;
            div.onclick = manuallyGetLocation;
            return div;
          },
          onRemove: function (map) {
            // Nothing to do here
          }
        });

        L.control.locationpin = function (opts) {
          return new L.Control.LocationPin(opts);
        };

        L.control.locationpin({ position: 'bottomleft' }).addTo(map);
      }



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
              userName: userData.vanName,
              active: userData.active,
              userID: userData.userID,
              firstLogin: userData.firstLogin,
              isVan: userData.isVan,
              vanIcon: userData.vanIcon,
              hasVan: userData.hasVan
            };



            if (!user.active) {
              if (user.userID === user.uid) {
                vans.push(user);
              }
            }

            if (user.isVan && user.active) {
              // vans.push(user);
            }

            if (user.hasVan && user.active) {
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


              const myIcon = L.icon({
                iconUrl: './images/vans/' + user.vanIcon + '.png',
                iconSize: [50, 50],
                iconAnchor: [22, 50],
                popupAnchor: [-3, -46]
              });

              //  if (user.userID === auth.currentUser.uid) {
              //    L.marker([user.latitude, user.longitude], { icon: myIcon_me }).addTo(map).bindPopup(`<b>${user.userName}</b><br><a href="https://www.google.com/maps/dir/?api=1&destination=$${user.latitude},${user.longitude}&travelmode=walking" target="_blank">Directions</a>`);
              // } else {
              L.marker([user.latitude, user.longitude], { icon: myIcon }).addTo(map).bindPopup(`<b>${user.userName}</b><br><a href="https://www.google.com/maps/dir/?api=1&destination=$${user.latitude},${user.longitude}&travelmode=walking" target="_blank">Directions</a>`);
              // }
            }
          });
        } catch (error) {
          console.error("Error fetching van data:", error);
        }
      }

      fetchUserData();
      setInterval(fetchUserData, 60 * 1000);

      updateLocationOnDatabase();
      const intervalId = setInterval(updateLocationOnDatabase, 60 * 1000);

      return () => clearInterval(intervalId);

    }
  }, [currentLocation, user]);



  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    updateMapLocation();
  }, [currentLocation, map]);



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

      if (user && user.uid) {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const userDocRef = doc(db, 'users', user.uid);

        await updateDoc(userDocRef, {
          active: !isLocationOn,
        });
        console.log("Updated database to " + !isLocationOn);

        // 1. Update userData in state
        setUserData({ ...userData, active: !isLocationOn });        

        // 2. Refresh vans from database       
        async function fetchUserData_onTimeFetch() {

          try {
            const usersRef = collection(db, 'users');
            const querySnapshot = await getDocs(usersRef);
            const vans = [];

            querySnapshot.forEach((doc) => {
              const userData = doc.data();
              const user = {
                longitude: userData.location._long,
                latitude: userData.location._lat,
                userName: userData.vanName,
                active: userData.active,
                userID: userData.userID,
                firstLogin: userData.firstLogin,
                isVan: userData.isVan,
                vanIcon: userData.vanIcon,
                hasVan: userData.hasVan
              };

              if (user.hasVan && user.active) {
                vans.push(user);
              }
            });

            map.eachLayer((layer) => {
              if (layer instanceof L.Marker) {
                map.removeLayer(layer);
              }
            });
            console.log("ONE TIME FETCH: Vans:", vans);

            vans.forEach((user) => {
              if (user.active) {
                //if (user.userID === auth.currentUser.uid) {  

                const myIcon2 = L.icon({
                  iconUrl: './images/vans/' + user.vanIcon + '.png',
                  iconSize: [50, 50],
                  iconAnchor: [22, 50],
                  popupAnchor: [-3, -46]
                });

                L.marker([user.latitude, user.longitude], { icon: myIcon2 }).addTo(map).bindPopup(`<b>${user.userName}</b><br><a href="https://www.google.com/maps/dir/?api=1&destination=$${user.latitude},${user.longitude}&travelmode=walking" target="_blank">Directions</a>`);
              }
            });
          } catch (error) {
            console.error("Error fetching van data:", error);
          }
        }
        fetchUserData_onTimeFetch();


        // 1.2 Update the van icon based on location toggle
        if (!isLocationOn) { // If location is now ON
          setToggleVanIcon(`./images/vans/${userData.vanIcon}.png`);
        } else { // If location is now OFF
          setToggleVanIcon("./images/van-grey.png");
        }


      } else {
        console.error("User not logged in or ID not available");
        setBannerMessage("User not logged in or ID not available");
        setBannerType('timed');
      }

      if (!isLocationOn) {
        setBannerMessage("Live location turned on");
      }
      else {
        setBannerMessage("Live location turned off");
      }
      setBannerType('timed');

    } catch (error) {
      console.error("Error toggling location:", error);
      setBannerMessage("Error toggling location");
      setBannerType('timed');
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
      }, 3200); // 3.5 seconds
    }

    return () => clearTimeout(timer);
  }, [bannerMessage, bannerType]);


  const goToWelcome = () => {
    window.location.href = "/welcome";
  };

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

      {bannerMessage && (
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
          {user && userData && userData.hasVan && (
            <> {/* Wrap the elements in a fragment */}
              <img
                src={toggleVanIcon}
                alt="Van Icon"
                className={styles.toggleVanIcon}
              />

              <div className={styles.toggleContainer}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={isLocationOn}
                    onChange={toggleLocation}
                  />
                  <span className={styles.slider}></span>
                </label>
                <span className={styles.toggleLabel}>
                  {isLocationOn ? "" : ""}
                </span>
              </div>
            </>
          )}

          {user && userData && (
            <button className={styles.userNameButton} onClick={goToWelcome}>
              <div className={styles.loginDetailsContainer}>
                <img
                  src={`/images/profile-pics/${userData.profilePicture}.jpg`}
                  alt="Profile Picture"
                  className={styles.profilePictureSmall}
                />
                <div>
                  <div className={styles.loggedInAs}>Logged in as:</div>
                  <div className={styles.userName}>{user.displayName}</div>
                </div>
              </div>
            </button>
          )}
        </div>
        <br />

       

        <div id="map" className={styles.mapContainer}></div>
        <div
          className={styles.createdBy}
          onClick={() => setShowUserDetails(!showUserDetails)} // Toggle visibility on click
        >
          Created by Zak Brindle
        </div>

        {showUserDetails && user && userData && (
          <div className={styles.userDetails}>
            <p>Name: {user.displayName}</p>
            <p>Email: {user.email}</p>
            <p>Location: {userData.location.latitude}, {userData.location.longitude}</p>
            <p>Owns a van?: {userData.hasVan ? "Yes" : "No"}</p>
            <p>Van Name: {userData.vanName}</p>
            <p>Live Location: {userData.active ? "Yes" : "No"}</p>

            <p>First Login: {userData ? (userData.firstLogin ? "Yes" : "No") : "Loading..."}</p>
            <p>UID: {user.uid}</p>
          </div>
        )}
      </div>
    </>
  );
}