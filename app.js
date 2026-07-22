// Initialize the NSAS announcement system pointing to your audio folder
const nsas = new AnnouncementSystem('./audio/');

// 1. Math helper to calculate distance in meters between two lat/lng coordinates
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

// 2. Define your fixed stops array
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

// 3. Initialize map (centered near Bayview / Ottawa)
const map = L.map('map').setView([45.411365, -75.715871], 14);

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

    // Update GPS marker position on map
    userMarker.setLatLng([userLat, userLng]);

    // Proximity check (50 meters threshold)
    routeStops.forEach((stop) => {
      const distance = getDistanceInMeters(userLat, userLng, stop.latLng.lat, stop.latLng.lng);

      if (distance <= 50 && !stop.announced) {
        stop.announced = true;
        nsas.internalAnnounce(stop.sounds);
        stopText.textContent = "Current Stop: "+stop.name;
      }
    });
  }, (error) => {
    console.error("GPS error:", error);
    btn.disabled = false;
    btn.textContent = "📡 Retry GPS";
  }, {
    enableHighAccuracy: true
  });
});