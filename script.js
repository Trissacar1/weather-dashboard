const form = document.getElementById("city-form");
const container = document.getElementById("weather-container");
const status = document.getElementById("status");
const unitToggle = document.getElementById("unit-toggle");

let useFahrenheit = false;

// Convert C → F
function toF(c) {
  return (c * 9) / 5 + 32;
}

// Fetch lat/lon for a city name
async function geocode(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");

  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`City not found: ${city}`);
  }

  return data.results[0];
}

// Fetch weather for lat/lon
async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();
  return data.current_weather;
}

// Render one card
function renderCard(name, weather) {
  const temp = useFahrenheit
    ? `${toF(weather.temperature).toFixed(1)} °F`
    : `${weather.temperature} °C`;

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h2>${name}</h2>
    <p>Temperature: ${temp}</p>
    <p>Wind: ${weather.windspeed} km/h</p>
  `;
  container.appendChild(card);
}

// Main flow
async function loadCities(cities) {
  container.innerHTML = "";
  status.textContent = "Loading...";
  status.className = "";

  try {
    for (const city of cities) {
      const location = await geocode(city);
      const weather = await getWeather(location.latitude, location.longitude);
      renderCard(location.name, weather);
    }
    status.textContent = "";
  } catch (err) {
    status.textContent = err.message;
    status.className = "error";
  }
}

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
  if (cities.every(Boolean)) {
    loadCities(cities);
  }
});
