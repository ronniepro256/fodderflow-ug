import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cloud, Droplets, Wind, MapPin, Loader } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  getUserLocation,
  fetchWeatherData,
  getWeatherAdvice,
  getWeatherIcon,
  type WeatherData,
} from "@/lib/weatherService";

export function RealWeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user's location
        const location = await getUserLocation();
        if (!location) {
          throw new Error("Unable to determine location");
        }

        // Fetch weather data
        const weatherData = await fetchWeatherData(location.latitude, location.longitude);
        if (!weatherData) {
          throw new Error("Unable to fetch weather data");
        }

        setWeather(weatherData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load weather";
        setError(message);
        console.error("Weather loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWeather();

    // Refresh weather every 10 minutes
    const interval = setInterval(loadWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading weather data...</p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (error || !weather) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="rounded-2xl border border-gray-200 bg-gradient-to-br from-red-50 to-orange-50 p-6 shadow-sm">
          <div className="text-center">
            <Cloud className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm text-red-700 font-medium">Weather unavailable</p>
            <p className="text-xs text-red-600 mt-1">{error || "Unable to load weather data"}</p>
            <p className="text-xs text-gray-600 mt-2">Please enable location access or check your connection</p>
          </div>
        </Card>
      </motion.div>
    );
  }

  const advice = getWeatherAdvice(weather);
  const icon = getWeatherIcon(weather.condition);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Local Weather</h3>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-gray-600" />
              <p className="text-xs text-gray-600">{weather.location}</p>
            </div>
          </div>
          <div className="text-4xl">{icon}</div>
        </div>

        {/* Main Weather Info */}
        <div className="space-y-3 mb-4">
          {/* Temperature and Condition */}
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{weather.temperature}°C</span>
              <span className="text-sm text-gray-600">{weather.condition}</span>
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Humidity */}
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-600 font-medium">Humidity</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{weather.humidity}%</p>
            </div>

            {/* Wind Speed */}
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Wind className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-600 font-medium">Wind</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{weather.windSpeed} km/h</p>
            </div>

            {/* Precipitation */}
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Cloud className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-600 font-medium">Rain</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{weather.precipitation}mm</p>
            </div>
          </div>
        </div>

        {/* Farming Advice */}
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <p className="text-sm text-gray-700">{advice}</p>
        </div>

        {/* Last Updated */}
        <p className="text-xs text-gray-500 mt-3 text-center">
          Updated just now • Powered by Open-Meteo
        </p>
      </Card>
    </motion.div>
  );
}
