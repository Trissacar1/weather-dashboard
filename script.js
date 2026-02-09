const form = document.getElementById("city-form");
const container = document.getElementById("weather-container");
const status = document.getElementById("status");
const unitToggle = document.getElementById("unit-toggle");

let useFahrenheit = true; // Default to F
unitToggle.textContent = "Show °C"; // Update button text on load

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

// Geocode city name
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

// Fetch timezone from API for lat/lon input
async function getTimezone(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Timezone fetch failed");
  const data = await res.json();
  return data.timezone || "UTC";
}

// Fetch weather
async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();
  return data.curr
