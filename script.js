const form = document.getElementById("city-form");
const container = document.getElementById("weather-container");
const status = document.getElementById("status");
const unitToggle = document.getElementById("unit-toggle");

let useFahrenheit = true;
unitToggle.textContent = "Show °C"; // default display

// Hardcoded defaults (lat/lon ensures they always load correctly)
const defaultLocations = [
  { name: "Buffalo, OK", lat: 36.753, lon: -98.108 },
  { name: "Cedar Park, TX", lat: 30.505, lon: -97.820 },
  { name: "Bridgeport, CT", lat: 41.186, lon: -73.195 }
];

// Pre-fill inputs with city names (user-facing)
const inputs = Array.from(form.querySelectorAll("input"));
defaultLocations.forEach((loc, idx) => {
  if (inputs[idx]) inputs[idx].value = loc.name.split(",")[0];
});

// Convert Celsius → Fahrenheit
function toF(c) { return (c * 9) / 5 + 32; }

// Geocode user-entered city name
async function geocode(city) {
  const cityParam = encodeURIComponent(city);
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${cityParam}&count=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");

  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`City not found: ${city}`);
  }

  const geo = data.results[0];
  let displayName = geo.name;
  if (geo.admin1) displayName += `, ${geo.admin1}`; // city + state
  return { lat: geo.latitude, lon: geo.longitude, name: displayName, timezone: geo.timezone };
}

// Fetch weather
async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();
  return data.current_weather;
}

// Get local time string
function getLocalTime(timezone) {
  try {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit" });
  } catch {
    return "N/A";
  }
}

// Render weather card
function renderCard(location, weather, isError = false) {
  const card = document.createElement("div");
  card.className = "card";

  if (isError) {
    card.innerHTML = `
      <h2>${location}</h2>
      <p class="error-message">Could not load data for this location.</p>
    `;
  } else {
    const temp = useFahrenheit ? `${toF(weather.temperature).toFixed(1)} °F` : `${weather.temperature} °C`;
    const time = location.timezone ? getLocalTime(location.timezone) : "N/A";
    card.innerHTML = `
      <h2>${location.name}</h2>
      <p>Local Time: ${time}</p>
      <p>Temperature: ${temp}</p>
      <p>Wind: ${weather.windspeed} km/h</p>
    `;
  }

  container.appendChild(card);
}

// Load multiple cities
async function loadCities(cities) {
  container.innerHTML = "";
  status.textContent = "Loading...";
  status.className = "";

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    try {
      let location;
      if (city.lat !== undefined && city.lon !== undefined) {
        // Use hardcoded default lat/lon
        location = city;
      } else {
        location = await geocode(city);
      }

      const weather = await getWeather(location.lat, location.lon);
      renderCard(location, weather);
    } catch {
      renderCard(city.name || city, null, true);
    }
  }

  status.textContent = "";
}

// Load defaults on page load
loadCities(defaultLocations);

// Handle form submit
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const cities = Array.from(form.querySelectorAll("input")).map(input => input.value.trim());
  loadCities(cities.map(name => ({ name })));
});

// Handle unit toggle
unitToggle.addEventListener("click", () => {
  useFahrenheit = !useFahrenheit;
  unitToggle.textContent = useFahrenheit ? "Show °C" : "Show °F";

  const cities = Array.from(form.querySelectorAll("input")).map(input => input.value.trim());
  if (cities.every(Boolean)) loadCities(cities.map(name => ({ name })));
});
