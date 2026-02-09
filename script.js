const form = document.getElementById("city-form");
const container = document.getElementById("weather-container");
const status = document.getElementById("status");
const unitToggle = document.getElementById("unit-toggle");

let useFahrenheit = false;

// Default locations with lat/lon
const defaultLocations = [
  { name: "Buffalo, OK", lat: 36.753, lon: -98.108 },
  { name: "Bridgeport, CT", lat: 41.186, lon: -73.195 },
  { name: "Cedar Park, TX", lat: 30.505, lon: -97.820 }
];

// Pre-fill inputs with default city names
const inputs = Array.from(form.querySelectorAll("input"));
defaultLocations.forEach((loc, idx) => {
  if (inputs[idx]) inputs[idx].value = loc.name.split(",")[0];
});

// Convert C → F
function toF(c) {
  return (c * 9) / 5 + 32;
}

// Detect if input is lat/lon
function parseLatLon(input) {
  const parts = input.split(",");
  if (parts.length === 2) {
    const lat = parseFloat(parts[0].trim());
    const lon = parseFloat(parts[1].trim());
    if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
  }
  return null;
}

// Fetch lat/lon and full resolved name for a city
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

  // Build full display name: city, state/province, country
  let displayName = geo.name;
  if (geo.admin1) displayName += `, ${geo.admin1}`;
  if (geo.country) displayName += `, ${geo.country}`;

  return { lat: geo.latitude, lon: geo.longitude, name: displayName, timezone: geo.timezone };
}

// Fetch weather for lat/lon
async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();
  return data.current_weather;
}

// Fetch current time for a location using timezone
function getLocalTime(timezone) {
  try {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit" });
  } catch {
    return "N/A";
  }
}

// Render one card
function renderCard(location, weather) {
  const temp = useFahrenheit
    ? `${toF(weather.temperature).toFixed(1)} °F`
    : `${weather.temperature} °C`;

  const time = location.timezone ? getLocalTime(location.timezone) : "N/A";

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h2>${location.name}</h2>
    <p>Local Time: ${time}</p>
    <p>Temperature: ${temp}</p>
    <p>Wind: ${weather.windspeed} km/h</p>
  `;
  container.appendChild(card);
}

// Main load function
async function loadCities(inputsArray) {
  container.innerHTML = "";
  status.textContent = "Loading...";
  status.className = "";

  try {
    for (const input of inputsArray) {
      let location;

      const latLon = parseLatLon(input);
      if (latLon) {
        // User entered lat/lon
        location = {
          name: `Lat: ${latLon.lat}, Lon: ${latLon.lon}`,
          lat: latLon.lat,
          lon: latLon.lon,
          timezone: "UTC"
        };
      } else {
        // User entered city name
        location = await geocode(input);
      }

      const weather = await getWeather(location.lat, location.lon);
      renderCard(location, weather);
    }
    status.textContent = "";
  } catch (err) {
    status.textContent = err.message;
    status.className = "error";
  }
}

// Initialize page with defaults (lat/lon)
loadCities(defaultLocations.map(loc => `${loc.lat},${loc.lon}`));

// Form submit
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const cities = Array.from(form.querySelectorAll("input")).map(
    (input) => input.value.trim()
  );
  loadCities(cities);
});

// Unit toggle
unitToggle.addEventListener("click", () => {
  useFahrenheit = !useFahrenheit;
  unitToggle.textContent = useFahrenheit ? "Show °C" : "Show °F";

  const cities = Array.from(form.querySelectorAll("input")).map(
    (input) => input.value.trim()
  );
  if (cities.every(Boolean)) loadCities(cities);
});
