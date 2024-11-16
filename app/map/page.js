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


export default function MapPage() {
  const [isOwner, setIsOwner] = useState(true);
  const [isLocationOn, setIsLocationOn] = useState(false);


  let defaultLatitude = "53.74328616942579";
  let defaultLongitude = "-2.493528328604127";

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
    
    // Assuming 'map' is accessible in this scope
    map.setView([myLatitude, myLongitude], 13); 
  } else {
    console.error("Latitude or longitude is null."); 
  }
}


 

  if (typeof window !== 'undefined') {
  // Code that uses window or other browser-specific APIs
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






    async function initMap() {

      console.log("CREATING MAP");
      const L = await import("leaflet"); // Dynamically import Leaflet

      const myIcon = L.icon({
        iconUrl: './images/van.png',
        iconSize: [50, 50], // Adjust size as needed
        iconAnchor: [22, 50], // Adjust anchor point
        popupAnchor: [-3, -46]
      });

      const myIcon_me = L.icon({
        iconUrl: './images/van-me.png',
        iconSize: [50, 50], // Adjust size as needed
        iconAnchor: [22, 50], // Adjust anchor point
        popupAnchor: [-3, -46]
      });




      const map = L.map("map").setView([myLatitude, myLongitude], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);





      async function fetchUserData() {
        try {

          const usersRef = collection(db, 'users');
          const querySnapshot = await getDocs(usersRef);
          const vans = [];

          querySnapshot.forEach((doc) => {
            const userData = doc.data();
            const user = {
              longitude: userData.location._long, // Access longitude from GeoPoint
              latitude: userData.location._lat,  // Access latitude from GeoPoint
              userName: userData.userName,
              active: userData.active,
              userID: userData.userID,
              isVan: userData.isVan

            };

            // ONLY GET ACTIVE VANS
            if (user.isVan && user.active) {
              vans.push(user);
              if (user.userID === userID_testing) {
                accountName = user.userName;
                console.log("Logged in user detected: " + accountName);
                setUsersName();
              }
            }
          });

          // Clear existing markers (if any) before adding new ones
          map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
              map.removeLayer(layer);
            }
          });

          console.log("Vans:", vans); // Log the array of van objects

          vans.forEach((user) => {
            if (user.active) {
              console.log("CREATING VAN ON MAP: Lat (" + user.latitude + ") Long (" + user.longitude + ")");


              if (user.userID === userID_testing) {
                L.marker([user.latitude, user.longitude], { icon: myIcon_me }).addTo(map).bindPopup(`<b>${user.userName}</b><br><a href="https://www.google.com/maps/dir/?api=1&origin=${myLatitude},${myLongitude}&destination=${user.latitude},${user.longitude}&travelmode=walking" target="_blank">Directions</a>`);
              }
              else {
                L.marker([user.latitude, user.longitude], { icon: myIcon }).addTo(map).bindPopup(`<b>${user.userName}</b><br><a href="https://www.google.com/maps/dir/?api=1&origin=${myLatitude},${myLongitude}&destination=${user.latitude},${user.longitude}&travelmode=walking" target="_blank">Directions</a>`);
              }
            }
          });

          // Now you can use the 'userData' array in your component, 
          // for example, to display the data or create markers on a map.


        } catch (error) {
          console.error("Error fetching van data:", error);
        }
      }

      fetchUserData();
      setInterval(fetchUserData, 60 * 1000);

    }

    // Add a 3-second delay before calling initMap
   
      initMap(); 
   

    return () => clearTimeout(timer); // Clear the timer on component unmount
   
  }, []);

  const toggleSettings = () => {
    const settingsPanel = document.getElementById("settingsPanel");
    settingsPanel.style.display =
      settingsPanel.style.display === "none" ? "block" : "none";
  };

  const userID_testing = 3;  // Replace with actual logged-in user ID later

  const toggleLocation = async () => {
    try {
      setIsLocationOn(!isLocationOn);

      // Get a reference to the user's document in Firestore

      const userDocRef = doc(db, 'users', userID_testing);

      // Update the 'active' field in Firestore
      await updateDoc(userDocRef, {
        active: !isLocationOn, // Toggle the value of 'active'
      });

      // Re-fetch user data to refresh the map markers
      //fetchUserData();

    } catch (error) {
      console.error("Error toggling location:", error);

    }
  };



  var accountName = "";

  async function setUsersName() {

    console.log("ACCOUNT NAME: " + accountName);
    if (accountName) {

      const userNameSpan = document.querySelector(`.${styles.userName}`);
      if (userNameSpan) {
        userNameSpan.textContent = accountName;
      }

    }
  }







  const logout = () => {
    // Add logout logic here (e.g., clear session, redirect to login)
    window.location.href = "/";
  };

  return (
    <>
      <Head>
    <title>Ice Cream Van</title>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

      </Head>

      <div className={styles.app}>
        <div className={styles.topBar}>
          <img
            src="./images/settings.png"
            alt="Settings"
            className={styles.settingsIcon}
            onClick={toggleSettings}
          />  
                  <div> {/* Add a wrapping div here */}
    <span className={styles.loggedInAs}>Logged in as:</span>
  </div>
  <div> 
    <span className={styles.userName}></span>
    </div>
        </div>

        <div id="settingsPanel" style={{ display: "none" }}>
          <button onClick={logout}>Logout</button>
          {isOwner && (
            <div id="vanOwnerSettings">
              <button onClick={toggleLocation}>
                {isLocationOn ? "Turn Off Location" : "Turn On Location"}
              </button>
            </div>
          )}
        </div>

        <div id="map" className={styles.mapContainer}></div>
      </div>
    </>
  );
}