const form = document.getElementById("city-form");
const container = document.getElementById("weather-container");
const status = document.getElementById("status");
const unitToggle = document.getElementById("unit-toggle");

let useFahrenheit = true; // Default to Fahrenheit
unitToggle.textContent = "Show °C"; // Set button text on load

// Default locations with lat/lon and names
const defaultLocations = [
  { name: "Buffalo, OK", lat: 36.753, lon: -98.108 },
  { name: "Cedar Park, TX", lat: 30.505, lon: -97.820 },
  { name: "Bridgeport, CT", lat: 41.186, lon: -73.195 }
];

// Pre-fill inputs with default city names
const inputs = Array.from(form.querySelectorAll("input"));
defaultLocations.forEach((loc, idx) => {
  if (inputs[idx]) inputs[idx].value = loc.name.split(",")[0];
});

// Convert Celsius → Fahrenheit
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

// Geocode city name to lat/lon + display name + timezone
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
  if (geo.admin1) displayName += `, ${geo.admin1}`;
  if (geo.country) displayName += `, ${geo.country}`;

  return { lat: geo.latitude, lon: geo.longitude, name: displayName, timezone: geo.timezone };
}

// Reverse geocode lat/lon to nearest city or fallback
async function reverseGeocode(lat, lon) {
  const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();

    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      return { 
        name: `Unknown location (Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)})`,
        timezone: "UTC"
      };
    }

    const geo = data.results[0];
    let displayName = geo.name;
    if (geo.admin1) displayName += `, ${geo.admin1}`;
    if (geo.country) displayName += `, ${geo.country}`;

    return { name: displayName, timezone: geo.timezone || "UTC" };
  } catch {
    return { 
      name: `Unknown location (Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)})`,
      timezone: "UTC"
    };
  }
}

// Fetch current weather for lat/lon
async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();
  return data.current_weather;
}

// Get local time string from timezone
function getLocalTime(timezone) {
  try {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit" });
  } catch {
    return "N/A";
  }
}

// Render a single weather card
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

// Load multiple cities (inputsArray: city names or lat/lon strings)
async function loadCities(inputsArray, displayNames = []) {
  container.innerHTML = "";
  status.textContent = "Loading...";
  status.className = "";

  try {
    for (let i = 0; i < inputsArray.length; i++) {
      const input = inputsArray[i];
      let location;

      const latLon = parseLatLon(input);
      if (latLon) {
        // User entered lat/lon: reverse-geocode to get city name + timezone
        const reverse = await reverseGeocode(latLon.lat, latLon.lon);
        location = {
          lat: latLon.lat,
          lon: latLon.lon,
          name: displayNames[i] || reverse.name,
          timezone: reverse.timezone
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

// Load defaults on page open using lat/lon + stored names
loadCities(
  defaultLocations.map(loc => `${loc.lat},${loc.lon}`),
  defaultLocations.map(loc => loc.name)
);

// Form submit handler
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const cities = Array.from(form.querySelectorAll("input")).map(input => input.value.trim());
  loadCities(cities);
});

// Unit toggle handler
unitToggle.addEventListener("click", () => {
  useFahrenheit = !useFahrenheit;
  unitToggle.textContent = useFahrenheit ? "Show °C" : "Show °F";

  const cities = Array.from(form.querySelectorAll("input")).map(input => input.value.trim());
  if (cities.every(Boolean)) loadCities(cities);
});
