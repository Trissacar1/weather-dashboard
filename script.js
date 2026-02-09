/* ===========================
   GENERAL RESET
=========================== */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: "Press Start 2P", cursive, sans-serif; /* 8-bit aesthetic */
  background-color: #f0f4f8;
  color: #1e293b;
  min-height: 100vh;
  padding: 20px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* ===========================
   HEADER
=========================== */
header {
  text-align: center;
  margin-bottom: 20px;
}

header h1 {
  font-size: 2rem;
  margin-bottom: 5px;
}

.note {
  font-size: 0.8rem;
  text-align: center;
  margin-bottom: 20px;
  color: #475569;
}

/* ===========================
   CONTROLS
=========================== */
.controls-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

#city-form {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

#city-form input {
  padding: 8px;
  border: 2px solid #94a3b8;
  border-radius: 6px;
  font-family: inherit;
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

#city-form button {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  background-color: #3b82f6;
  color: #fff;
  transition: transform 0.2s ease, background-color 0.3s ease;
}

#city-form button:hover {
  transform: scale(1.05);
  background-color: #2563eb;
}

.toggles {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.toggles button {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  background-color: #64748b;
  color: #fff;
  transition: transform 0.2s ease, background-color 0.3s ease;
}

.toggles button:hover {
  transform: scale(1.05);
  background-color: #475569;
}

/* ===========================
   WEATHER CARDS
=========================== */
#weather-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
}

.card {
  background-color: #e2e8f0;
  border: 2px solid #94a3b8;
  border-radius: 10px;
  padding: 15px;
  width: 200px;
  text-align: center;
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  font-family: inherit;
}

.card h2 {
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.card p {
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.error-message {
  color: #dc2626;
  font-weight: bold;
}

/* ===========================
   STATUS
=========================== */
#status {
  text-align: center;
  margin-bottom: 15px;
  font-weight: bold;
}

/* ===========================
   DARK MODE
=========================== */
body.dark {
  background-color: #0f172a;
  color: #e5e7eb;
}

body.dark header h1,
body.dark header p {
  color: #e5e7eb;
}

body.dark .note {
  color: #cbd5f5;
}

body.dark .card {
  background-color: #1e293b;
  color: #e5e7eb;
  border-color: #334155;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

body.dark input {
  background-color: #020617;
  color: #e5e7eb;
  border: 1px solid #334155;
}

body.dark button {
  background-color: #334155;
  color: #f8fafc;
}

body.dark button:hover {
  background-color: #475569;
}

/* ===========================
   TRANSITIONS & ANIMATION
=========================== */
body,
.card,
input,
button {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
