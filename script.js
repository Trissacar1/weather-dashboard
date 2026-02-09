const form = document.getElementById("city-form");
const container = document.getElementById("weather-container");
const status = document.getElementById("status");
const unitToggle = document.getElementById("unit-toggle");

let useFahrenheit = true;
unitToggle.textContent = "Show °C";

// Hardcoded defaults (reliable via lat/lon)
const defaultLocations = [
  { name: "Buffalo, OK", lat: 36.753, lon: -98.108 },
  { name: "Cedar Park, TX", lat: 30.505, lon: -97.820 },
  { name: "Bridgeport, CT", lat: 41.186, lon: -73.195 }
];

// Pre-fill inputs with city names only
const inputs = Array.from(form.querySelectorAll("input"));
defaultLocations.forEach((loc, idx) => {
  if (inputs[idx]) inputs[idx].value = loc.name.split(",")[0];
});

// Celsius → Fahrenheit
function toF(c) {
  return (c * 9) / 5 + 32;
}

// Geocode city name (largest match only)
async function geocode(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");

  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("City not found");
  }

  const geo = data.results[0];
  let displayName = geo.name;
  if (geo.admin1) displayName += `, ${geo.admin1}`;

  return {
    name: displayName,
    lat: geo.latitude,
    lon: geo.longitude,
    timezone: geo.timezone
  };
}

// Fetch current weather
async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");

  const data = await res.json();
  return data.current_weather;
}

// Local time formatting
function getLocalTime(timezone) {
  try {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit"
    });
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
    const temp = useFahrenheit
      ? `${toF(weather.temperature).toFixed(1)} °F`
      : `${weather.temperature} °C`;

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

// Core loader (handles defaults + user input safely)
async function loadCities(entries) {
  container.innerHTML = "";
  status.textContent = "Loading...";

  for (const entry of entries) {
    try {
      let location;

      // Default city (already has lat/lon)
      if (entry && typeof entry === "object" && "lat" in entry) {
        location = entry;
      }
      // User-entered city (string)
      else if (typeof entry === "string" && entry.length > 0) {
        location = await geocode(entry);
      } else {
        throw new Error("Invalid input");
      }

      const weather = await getWeather(location.lat, location.lon);
      renderCard(location, weather);

    } catch {
      const label =
        typeof entry === "string"
          ? entry
          : entry?.name || "Unknown location";

      renderCard(label, null, true);
    }
  }

  status.textContent = "";
}

// Load defaults on first visit
loadCities(defaultLocations);

// Handle form submit
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const cities = Array.from(form.querySelectorAll("input"))
    .map(input => input.value.trim());

  loadCities(cities);
});

// Handle unit toggle
unitToggle.addEventListener("click", () => {
  useFahrenheit = !useFahrenheit;
  unitToggle.textContent = useFahrenheit ? "Show °C" : "Show °F";

  const cities = Array.from(form.querySelectorAll("input"))
    .map(input => input.value.trim());

  loadCities(cities);
});
