const nsas = new AnnouncementSystem('./audio/');

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

const routeStops = [
  {
    name: "PRESTON / ANDERSON",
    latLng: L.latLng(45.407500, -75.713614),
    sounds: ["Tone1", "Anderson-Street", "Rue-Anderson"],
    announced: false
  },
  {
    name: "PRESTON / SOMERSET W",
    latLng: L.latLng(45.408277, -75.714075),
    sounds: ["Tone1", "Preston", "_and", "Somerset", "Preston", "_et", "Somerset"],
    announced: false
  },
  {
    name: "PRESTON / ELM",
    latLng: L.latLng(45.409984, -75.715010),
    sounds: ["Tone1", "Preston", "Preston"],
    announced: false
  },
    {
    name: "PRESTON / ALBERT",
    latLng: L.latLng(45.411249, -75.715785),
    sounds: ["Tone1", "Preston", "_and", "Albert", "Preston", "_et", "Albert-FR"],
    announced: false
  },
  {
    name: "PIMISI",
    latLng: L.latLng(45.413837, -75.713241),
    sounds: ["Tone1", "Pimisi Stn", "O-Train_Line1", "Stn Pimisi", "O-Train_Ligne1"],
    announced: false
  }
];

const map = L.map('map').setView([45.411365, -75.715871], 14);
let currentStopIndex = 0; 
let lastannStop = null;
let stopReached = false;
let lastStopAnnounced = false;

const stopArriveDis = 75; 
const stopLeaveDis = 50; 

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 4. Add locked routing control (Fixed points & disabled auto-zoom)
L.Routing.control({
  waypoints: routeStops.map(stop => stop.latLng),
  routeWhileDragging: false,
  addWaypoints: false,       // Prevents adding new route points
  draggableWaypoints: false, // Disables dragging route waypoints
  fitSelectedRoutes: false,  // PREVENTS zooming out automatically
  autoFitBounds: false,      // PREVENTS reframing the camera
  
  // Custom marker generator to enforce fixed markers
  createMarker: function(i, waypoint) {
    const stop = routeStops[i];
    return L.marker(waypoint.latLng, {
      draggable: false // Locks the visual map pin in place
    }).bindPopup(`<b>Stop ${i + 1}:</b> ${stop ? stop.name : 'Waypoint'}`);
  }
}).addTo(map);

// 5. GPS Tracking Trigger
let userMarker = null;

document.getElementById('startGpsBtn').addEventListener('click', (e) => {
  const btn = e.target;
  btn.disabled = true;
  btn.textContent = "📡 GPS Tracking Active";

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  // Create a marker to track user location
  userMarker = L.circleMarker([0, 0], {
    color: '#007bff',
    radius: 8,
    fillOpacity: 0.8
  }).addTo(map);

navigator.geolocation.watchPosition((position) => { 
    const userLat = position.coords.latitude; 
    const userLng = position.coords.longitude; 
    const stopText = document.getElementById("StopTxt"); 
    
    userMarker.setLatLng([userLat, userLng]); 
    
    if (currentStopIndex < routeStops.length) {
        
        // Get the single, upcoming stop (Equivalent to stopList[1] in Roblox)
        const currentStop = routeStops[currentStopIndex];
        
        // Calculate distance to this specific upcoming stop
        const distance = getDistanceInMeters(userLat, userLng, currentStop.latLng.lat, currentStop.latLng.lng); 
        
        // --- 1. THE ANNOUNCEMENT LOGIC ---
        // Instantly announce the stop ahead of time if it hasn't been announced yet
        if (currentStop !== lastannStop) { 
            lastannStop = currentStop; 
            currentStop.announced = true; 
            nsas.internalAnnounce(currentStop.sounds); 
            stopText.textContent = "Current Stop: " + currentStop.name; 
        } 
        
        // --- 2. ARRIVAL DETECTION (Roblox: Distance < stopArriveDis) ---
        if (distance < stopArriveDis) {
            stopReached = true;
            // You can trigger arrival text or door open logic here if needed
        }
        
        // --- 3. DEPARTURE DETECTION (Roblox: Distance > stopLeaveDis and stopReached == true) ---
        // Once the user leaves the stop radius, advance the queue to the next stop
        if (distance > stopLeaveDis && stopReached === true) {
            stopReached = false; // Reset for the next stop
            currentStopIndex++;  // Move to next stop (Equivalent to table.remove(stopIndex, 1))
            
            console.log("Left the stop. Next index is: " + currentStopIndex);
        }
        
    } else {
        // Equivalent to #stopIndex == 0 in Roblox
        stopText.textContent = "LAST STOP / DERNIER ARRÊT";
        if (nsas.isRunning == false && !lastStopAnnounced){
          lastStopAnnounced = true;
          nsas.internalAnnounce(["LAST-STOP"]); 
        }
    }

}, (error) => { 
    console.error("GPS error:", error); 
    btn.disabled = false; 
    btn.textContent = "📡 Retry GPS"; 
}, { enableHighAccuracy: true });
});