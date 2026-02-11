const form = document.getElementById("city-form");
const container = document.getElementById("weather-container");
const status = document.getElementById("status");
const unitToggle = document.getElementById("unit-toggle");
const themeToggle = document.getElementById("theme-toggle");
const resetBtn = document.getElementById("reset-btn");

let useFahrenheit = true;
unitToggle.textContent = "Show °C";

/* =========================
   DARK / LIGHT MODE
========================= */

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

/* =========================
   DEFAULT LOCATIONS
========================= */

const defaultLocations = [
  { name: "Buffalo, OK", lat: 36.753, lon: -98.108, timezone: "America/Chicago" },
  { name: "Cedar Park, TX", lat: 30.505, lon: -97.820, timezone: "America/Chicago" },
  { name: "Bridgeport, CT", lat: 41.186, lon: -73.195, timezone: "America/New_York" }
];

const inputs = Array.from(form.querySelectorAll("input"));

defaultLocations.forEach((loc, idx) => {
  if (inputs[idx]) {
    inputs[idx].value = loc.name;
  }
});

/* =========================
   HELPERS
========================= */

function toF(c) {
  return (c * 9) / 5 + 32;
}

function parseLatLon(input) {
  const parts = input.split(",");
  if (parts.length === 2) {
    const lat = parseFloat(parts[0].trim());
    const lon = parseFloat(parts[1].trim());
    if (!isNaN(lat) && !isNaN(lon)) {
      return { lat, lon };
    }
  }
  return null;
}

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

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");

  const data = await res.json();
  return data.current_weather;
}

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

function getEmoji(weatherCode, timezone) {
  const hour = parseInt(
    new Date().toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour12: false,
      hour: "2-digit"
    })
  );

  const isNight = hour < 6 || hour >= 18;

  if ([0, 1].includes(weatherCode)) return isNight ? "🌙" : "☀️";
  if ([2, 3, 45, 48].includes(weatherCode)) return "☁️";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) return "🌧️";
  if ([71, 73, 75, 77].includes(weatherCode)) return "❄️";
  if ([95, 96, 99].includes(weatherCode)) return "⛈️";

  return isNight ? "🌙" : "☀️";
}

/* =========================
   RENDER CARD
========================= */

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

    const time = getLocalTime(location.timezone);
    const emoji = getEmoji(weather.weathercode, location.timezone);

    card.innerHTML = `
      <div class="weather-icon">${emoji}</div>
      <h2>${location.name}</h2>
      <p class="weather-time">Local Time: ${time}</p>
      <p class="weather-temp">${temp}</p>
      <p class="weather-desc">Wind: ${weather.windspeed} km/h</p>
    `;
  }

  container.appendChild(card);
}

/* =========================
   LOAD CITIES
========================= */

async function loadCities(entries) {
  container.innerHTML = "";
  status.textContent = "Loading...";

  for (const entry of entries) {
    try {
      let location;

      if (entry && typeof entry === "object" && "lat" in entry) {
        location = entry;
      } else if (typeof entry === "string" && entry.length > 0) {
        const latLon = parseLatLon(entry);
        if (latLon) {
          location = {
            name: entry,
            lat: latLon.lat,
            lon: latLon.lon,
            timezone: "UTC"
          };
        } else {
          location = await geocode(entry);
        }
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

/* =========================
   INITIAL LOAD
========================= */

loadCities(defaultLocations);

/* =========================
   EVENT HANDLERS
========================= */

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const cities = inputs.map(i => i.value.trim());
  loadCities(cities);
});

unitToggle.addEventListener("click", () => {
  useFahrenheit = !useFahrenheit;
  unitToggle.textContent = useFahrenheit ? "Show °C" : "Show °F";
  const cities = inputs.map(i => i.value.trim());
  loadCities(cities);
});

resetBtn.addEventListener("click", () => {
  defaultLocations.forEach((loc, idx) => {
    if (inputs[idx]) inputs[idx].value = loc.name;
  });
  loadCities(defaultLocations);
});
