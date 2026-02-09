const form = document.getElementById("city-form");
const container = document.getElementById("weather-container");
const status = document.getElementById("status");
const unitToggle = document.getElementById("unit-toggle");
const themeToggle = document.getElementById("theme-toggle");

let useFahrenheit = true;
unitToggle.textContent = "Show °C";

// ------------------------
// DARK/LIGHT MODE
// ------------------------
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const savedTheme = localStorage.getItem("theme");
const shouldUseDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;

if (shouldUseDark) {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️ Day Mode";
} else {
  themeToggle.textContent = "🌙 Night Mode";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.textContent = isDark ? "☀️ Day Mode" : "🌙 Night Mode";
});

// ------------------------
// DEFAULT LOCATIONS
// ------------------------
const defaultLocations = [
  { name: "Buffalo, OK", lat: 36.753, lon: -98.108 },
  { name: "Cedar Park, TX", lat: 30.505, lon: -97.820 },
  { name: "Bridgeport, CT", lat: 41.186, lon: -73.195 }
];

const inputs = Array.from(form.querySelectorAll("input"));
defaultLocations.forEach((loc, idx) => {
  if (inputs[idx]) inputs[idx].value = loc.name.split(",")[0];
});

// ------------------------
// HELPER FUNCTIONS
// ------------------------
function toF(c) { return (c*9)/5 + 32; }

async function geocode(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.results || data.results.length===0) throw new Error("City not found");

  const geo = data.results[0];
  let displayName = geo.name;
  if (geo.admin1) displayName += `, ${geo.admin1}`;
  return { name: displayName, lat: geo.latitude, lon: geo.longitude, timezone: geo.timezone };
}

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();
  return data.current_weather;
}

function getLocalTime(timezone) {
  try {
    return new Date().toLocaleTimeString("en-US", { timeZone: timezone, hour:"2-digit", minute:"2-digit" });
  } catch { return "N/A"; }
}

// ------------------------
// RENDER CARD WITH WEATHER ICON + ANIMATED BACKGROUND
// ------------------------
function renderCard(location, weather, isError=false) {
  const card = document.createElement("div");
  card.className = "card";

  if (isError) {
    card.innerHTML = `<h2>${location}</h2><p class="error-message">Could not load data for this location.</p>`;
  } else {
    const temp = useFahrenheit ? `${toF(weather.temperature).toFixed(1)} °F` : `${weather.temperature} °C`;
    const time = location.timezone ? getLocalTime(location.timezone) : "N/A";

    // Determine day/night
    const hourNum = parseInt(new Date().toLocaleTimeString("en-US",{ timeZone: location.timezone, hour12:false, hour:"2-digit" }));
    const isNight = hourNum < 6 || hourNum >= 18;

    // Map weather code to icon
    let iconClass;
    const code = weather.weathercode;
    if ([0,1,2].includes(code)) iconClass = isNight ? "moon":"sunny";
    else if ([3,45,48,51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) iconClass = "cloudy";
    else if ([71,73,75,77].includes(code)) iconClass = "snow";
    else if ([95,96,99].includes(code)) iconClass = "thunderstorm";
    else iconClass = isNight?"moon":"sunny";

    // Set card class for animated background
    card.classList.add(iconClass);

    card.innerHTML = `
      <div class="weather-icon ${iconClass}"></div>
      <h2>${location.name}</h2>
      <p>Local Time: ${time}</p>
      <p>Temperature: ${temp}</p>
      <p>Wind: ${weather.windspeed} km/h</p>
    `;
  }

  container.appendChild(card);
}

// ------------------------
// LOAD CITIES
// ------------------------
async function loadCities(entries) {
  container.innerHTML = "";
  status.textContent = "Loading...";

  for (const entry of entries) {
    try {
      let location;
      if (entry && typeof entry==="object" && "lat" in entry) location=entry;
      else if (typeof entry==="string" && entry.length>0) location=await geocode(entry);
      else throw new Error("Invalid input");

      const weather = await getWeather(location.lat, location.lon);
      renderCard(location, weather);

    } catch {
      const label = typeof entry==="string"? entry : entry?.name || "Unknown location";
      renderCard(label, null, true);
    }
  }

  status.textContent="";
}

// ------------------------
// INITIAL LOAD
// ------------------------
loadCities(defaultLocations);

// ------------------------
// EVENT HANDLERS
// ------------------------
form.addEventListener("submit", (e)=>{
  e.preventDefault();
  const cities = Array.from(form.querySelectorAll("input")).map(i=>i.value.trim());
  loadCities(cities);
});

unitToggle.addEventListener("click", ()=>{
  useFahrenheit = !useFahrenheit;
  unitToggle.textContent = useFahrenheit ? "Show °C" : "Show °F";
  const cities = Array.from(form.querySelectorAll("input")).map(i=>i.value.trim());
  loadCities(cities);
});
