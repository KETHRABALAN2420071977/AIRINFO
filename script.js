
// =====================================
// HTML ELEMENTS
// =====================================

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");

const errorMessage = document.getElementById("error-message");
const loadingMessage = document.getElementById("loading-message");

const weatherSection = document.getElementById("weather-section");

const cityName = document.getElementById("city-name");
const weatherDate = document.getElementById("weather-date");
const weatherIcon = document.getElementById("weather-icon");
const temperature = document.getElementById("temperature");
const weatherDescription = document.getElementById("weather-description");
const feelsLike = document.getElementById("feels-like");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");

const forecastGrid = document.getElementById("forecast-grid");

const celsiusBtn = document.getElementById("celsius-btn");
const fahrenheitBtn = document.getElementById("fahrenheit-btn");

const recentCities = document.getElementById("recent-cities");


// =====================================
// GLOBAL VARIABLES
// =====================================

let weatherData = null;
let currentUnit = "C";


// =====================================
// WEATHER CODE INFORMATION
// =====================================

function getWeatherInfo(code) {

    const weatherCodes = {
        0: ["Clear Sky", "☀️"],
        1: ["Mainly Clear", "🌤️"],
        2: ["Partly Cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Foggy", "🌫️"],
        48: ["Depositing Rime Fog", "🌫️"],
        51: ["Light Drizzle", "🌦️"],
        53: ["Moderate Drizzle", "🌦️"],
        55: ["Dense Drizzle", "🌧️"],
        61: ["Slight Rain", "🌧️"],
        63: ["Moderate Rain", "🌧️"],
        65: ["Heavy Rain", "🌧️"],
        71: ["Slight Snow", "🌨️"],
        73: ["Moderate Snow", "❄️"],
        75: ["Heavy Snow", "❄️"],
        80: ["Rain Showers", "🌦️"],
        81: ["Moderate Showers", "🌧️"],
        82: ["Heavy Showers", "⛈️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with Hail", "⛈️"],
        99: ["Heavy Thunderstorm", "⛈️"]
    };

    return weatherCodes[code] || ["Unknown Weather", "🌡️"];
}


// =====================================
// TEMPERATURE CONVERSION
// =====================================

function convertTemperature(value) {

    if (currentUnit === "F") {
        return (value * 9 / 5) + 32;
    }

    return value;
}


// =====================================
// INPUT DEBOUNCE
// =====================================

function debounce(callback, delay) {

    let timeout;

    return function (...args) {

        clearTimeout(timeout);

        timeout = setTimeout(() => {
            callback.apply(this, args);
        }, delay);

    };
}


// =====================================
// CITY COORDINATES API
// =====================================

async function getCityCoordinates(city) {

    const url =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to connect to location service.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("City not found. Please try another city.");
    }

    return data.results[0];
}


// =====================================
// WEATHER DATA API
// =====================================

async function getWeatherData(latitude, longitude) {

    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,surface_pressure&hourly=visibility&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to fetch weather information.");
    }

    return await response.json();
}


// =====================================
// SAVE RECENT SEARCHES
// =====================================

function saveRecentCity(city) {

    let cities = JSON.parse(
        localStorage.getItem("airinfo-recent-cities") || "[]"
    );

    // Remove duplicate city names
    cities = cities.filter(
        item => item.toLowerCase() !== city.toLowerCase()
    );

    // Add latest search at the beginning
    cities.unshift(city);

    // Keep only the latest 3
    cities = cities.slice(0, 3);

    localStorage.setItem(
        "airinfo-recent-cities",
        JSON.stringify(cities)
    );

    displayRecentCities();
}


// =====================================
// DISPLAY RECENT SEARCHES
// =====================================

function displayRecentCities() {

    const cities = JSON.parse(
        localStorage.getItem("airinfo-recent-cities") || "[]"
    );

    recentCities.innerHTML = "";

    cities.forEach(city => {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "recent-city-btn";
        button.textContent = city;

        button.addEventListener("click", function () {

            cityInput.value = city;

            searchWeather(city);

        });

        recentCities.appendChild(button);

    });
}


// =====================================
// SEARCH WEATHER
// =====================================

async function searchWeather(city) {

    if (!city || city.trim().length < 2) {

        errorMessage.textContent =
            "Please enter a valid city name.";

        return;
    }

    errorMessage.textContent = "";
    loadingMessage.style.display = "block";
    searchBtn.disabled = true;

    try {

        // Get city coordinates
        const location = await getCityCoordinates(city.trim());

        // Get weather information
        const data = await getWeatherData(
            location.latitude,
            location.longitude
        );

        // Store weather information
        weatherData = {
            location: location,
            data: data
        };

        // Save last searched city
        localStorage.setItem(
            "airinfo-last-city",
            location.name
        );

        // Save recent searches
        saveRecentCity(location.name);

        // Display weather
        displayWeather();

    } catch (error) {

        errorMessage.textContent = error.message;

    } finally {

        loadingMessage.style.display = "none";
        searchBtn.disabled = false;

    }
}


// =====================================
// DISPLAY CURRENT WEATHER
// =====================================

function displayWeather() {

    const location = weatherData.location;
    const data = weatherData.data;
    const current = data.current;

    const weatherInfo = getWeatherInfo(current.weather_code);

    const temp = convertTemperature(current.temperature_2m);
    const feels = convertTemperature(current.apparent_temperature);

    const unit = currentUnit === "C" ? "°C" : "°F";

    cityName.textContent =
        `${location.name}, ${location.country}`;

    weatherDate.textContent =
        `${location.admin1 || ""} • ${new Date().toLocaleString()}`;

    weatherIcon.textContent = weatherInfo[1];

    temperature.textContent =
        `${Math.round(temp)}${unit}`;

    weatherDescription.textContent =
        weatherInfo[0];

    feelsLike.textContent =
        `Feels like ${Math.round(feels)}${unit}`;

    humidity.textContent =
        `${current.relative_humidity_2m}%`;

    windSpeed.textContent =
        `${current.wind_speed_10m} km/h`;

    pressure.textContent =
        `${Math.round(current.surface_pressure)} hPa`;

    // Find the current or nearest hourly visibility
    const currentTime = new Date(current.time).getTime();

    let closestIndex = 0;
    let smallestDifference = Infinity;

    data.hourly.time.forEach((time, index) => {

        const difference = Math.abs(
            new Date(time).getTime() - currentTime
        );

        if (difference < smallestDifference) {
            smallestDifference = difference;
            closestIndex = index;
        }

    });

    visibility.textContent =
        `${(data.hourly.visibility[closestIndex] / 1000).toFixed(1)} km`;

    // Display five-day forecast
    displayForecast();

    weatherSection.style.display = "block";
}


// =====================================
// DISPLAY FIVE-DAY FORECAST
// =====================================

function displayForecast() {

    const daily = weatherData.data.daily;

    forecastGrid.innerHTML = "";

    for (let i = 0; i < daily.time.length; i++) {

        const date = new Date(daily.time[i]);

        const day = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        const weatherInfo = getWeatherInfo(
            daily.weather_code[i]
        );

        const maxTemp = convertTemperature(
            daily.temperature_2m_max[i]
        );

        const minTemp = convertTemperature(
            daily.temperature_2m_min[i]
        );

        const unit = currentUnit === "C" ? "°" : "°";

        const card = document.createElement("div");

        card.className = "forecast-card";

        card.innerHTML = `
            <p>${day}</p>

            <div class="forecast-icon">
                ${weatherInfo[1]}
            </div>

            <h3>${Math.round(maxTemp)}${unit}</h3>

            <p>${Math.round(minTemp)}${unit}</p>

            <small>${weatherInfo[0]}</small>
        `;

        forecastGrid.appendChild(card);

    }
}


// =====================================
// SEARCH FORM EVENT
// =====================================

searchForm.addEventListener("submit", function (event) {

    event.preventDefault();

    searchWeather(cityInput.value);

});


// =====================================
// INPUT VALIDATION
// =====================================

cityInput.addEventListener("input", debounce(function () {

    if (cityInput.value.trim().length === 1) {

        errorMessage.textContent =
            "Please enter at least 2 characters.";

    } else {

        errorMessage.textContent = "";

    }

}, 400));


// =====================================
// CELSIUS BUTTON
// =====================================

celsiusBtn.addEventListener("click", function () {

    currentUnit = "C";

    celsiusBtn.classList.add("active");
    fahrenheitBtn.classList.remove("active");

    if (weatherData) {
        displayWeather();
    }

});


// =====================================
// FAHRENHEIT BUTTON
// =====================================

fahrenheitBtn.addEventListener("click", function () {

    currentUnit = "F";

    fahrenheitBtn.classList.add("active");
    celsiusBtn.classList.remove("active");

    if (weatherData) {
        displayWeather();
    }

});


// =====================================
// INITIALIZE APPLICATION
// =====================================

// Display saved recent searches
displayRecentCities();

// Restore the last searched city
const lastCity = localStorage.getItem("airinfo-last-city");

// Load last city, or Madurai for first-time visitors
searchWeather(lastCity || "Madurai");
