/**
 * Weather Service using Open-Meteo API (free, no API key required)
 * Provides real-time weather data based on geolocation
 */

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  precipitation: number;
  latitude: number;
  longitude: number;
  location: string;
}

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Get user's geolocation using browser Geolocation API
 */
export async function getUserLocation(): Promise<GeolocationCoordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Geolocation error:", error.message);
        // Fallback to default Uganda coordinates (Kampala)
        resolve({
          latitude: 0.3476,
          longitude: 32.5825,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 3600000, // Cache for 1 hour
      }
    );
  });
}

/**
 * Fetch weather data from Open-Meteo API
 */
export async function fetchWeatherData(
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  try {
    // Open-Meteo API endpoint
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.append("latitude", latitude.toString());
    url.searchParams.append("longitude", longitude.toString());
    url.searchParams.append("current", "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,rain");
    url.searchParams.append("timezone", "auto");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.current) {
      throw new Error("Invalid weather data format");
    }

    const current = data.current;
    const condition = interpretWeatherCode(current.weather_code);

    return {
      temperature: Math.round(current.temperature_2m),
      condition,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      rainProbability: current.rain ? 85 : 15, // Simplified; API doesn't provide probability in free tier
      precipitation: current.precipitation || 0,
      latitude,
      longitude,
      location: await getLocationName(latitude, longitude),
    };
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    return null;
  }
}

/**
 * Interpret WMO weather code to human-readable condition
 * Reference: https://www.open-meteo.com/en/docs
 */
function interpretWeatherCode(code: number): string {
  // WMO Weather interpretation codes
  if (code === 0) return "Clear sky";
  if (code === 1 || code === 2) return "Mostly clear";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code === 51 || code === 53 || code === 55) return "Light drizzle";
  if (code === 61 || code === 63 || code === 65) return "Rain";
  if (code === 71 || code === 73 || code === 75) return "Snow";
  if (code === 77) return "Snow grains";
  if (code === 80 || code === 81 || code === 82) return "Rain showers";
  if (code === 85 || code === 86) return "Snow showers";
  if (code === 95 || code === 96 || code === 99) return "Thunderstorm";
  return "Unknown";
}

/**
 * Get location name from coordinates using reverse geocoding
 * Falls back to coordinates if service unavailable
 */
async function getLocationName(latitude: number, longitude: number): Promise<string> {
  try {
    // Open-Meteo Geocoding API (free, no key required)
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.append("latitude", latitude.toString());
    url.searchParams.append("longitude", longitude.toString());
    url.searchParams.append("language", "en");

    const response = await fetch(url.toString());

    if (!response.ok) {
      return `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const parts = [];
      if (result.name) parts.push(result.name);
      if (result.admin1) parts.push(result.admin1);
      if (result.country) parts.push(result.country);
      return parts.join(", ");
    }

    return `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
  } catch (error) {
    console.warn("Failed to get location name:", error);
    return `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
  }
}

/**
 * Determine if weather is suitable for farming activities
 */
export function getWeatherAdvice(weatherData: WeatherData): string {
  const { condition, rainProbability, humidity, temperature } = weatherData;

  if (condition.toLowerCase().includes("rain")) {
    return "🌧️ Tip: Ensure silage and bran are covered to avoid spoilage. Good time to check feed storage.";
  }

  if (condition.toLowerCase().includes("clear") || condition.toLowerCase().includes("sunny")) {
    if (temperature > 28) {
      return "☀️ Tip: High temperature. Ensure animals have access to water. Monitor for heat stress.";
    }
    return "☀️ Tip: Ideal conditions for pasture growth. Monitor water availability for animals.";
  }

  if (condition.toLowerCase().includes("overcast") || condition.toLowerCase().includes("cloudy")) {
    if (humidity > 80) {
      return "☁️ Tip: High humidity. Ensure good ventilation in feed storage to prevent mold.";
    }
    return "☁️ Tip: Moderate conditions. Good time for routine farm maintenance.";
  }

  if (condition.toLowerCase().includes("fog")) {
    return "🌫️ Tip: Low visibility. Be cautious during animal movements. Check feed storage ventilation.";
  }

  if (condition.toLowerCase().includes("snow")) {
    return "❄️ Tip: Cold weather ahead. Ensure animals have adequate shelter and warm feed.";
  }

  return "📍 Tip: Monitor weather changes. Keep feed storage dry and well-ventilated.";
}

/**
 * Get weather icon based on condition
 */
export function getWeatherIcon(condition: string): string {
  const lower = condition.toLowerCase();

  if (lower.includes("rain")) return "🌧️";
  if (lower.includes("clear") || lower.includes("sunny")) return "☀️";
  if (lower.includes("cloud") || lower.includes("overcast")) return "☁️";
  if (lower.includes("fog")) return "🌫️";
  if (lower.includes("snow")) return "❄️";
  if (lower.includes("thunder")) return "⛈️";
  if (lower.includes("drizzle")) return "🌦️";

  return "🌤️";
}
