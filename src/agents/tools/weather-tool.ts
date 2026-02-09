/**
 * Weather Tool
 *
 * Get weather information from OpenWeatherMap API.
 */

// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

export interface WeatherToolParams {
  config?: AeonSageConfig;
}

export interface WeatherData {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDir: number;
    clouds: number;
    visibility: number;
    description: string;
    icon: string;
  };
  forecast?: Array<{
    date: string;
    tempMin: number;
    tempMax: number;
    description: string;
    icon: string;
  }>;
}

export interface WeatherResult {
  success: boolean;
  data?: WeatherData;
  formatted?: string;
  error?: string;
}

/**
 * Get weather icon emoji
 */
function getWeatherEmoji(iconCode: string): string {
  const iconMap: Record<string, string> = {
    "01d": "☀️",
    "01n": "🌙",
    "02d": "⛅",
    "02n": "☁️",
    "03d": "☁️",
    "03n": "☁️",
    "04d": "☁️",
    "04n": "☁️",
    "09d": "🌧️",
    "09n": "🌧️",
    "10d": "🌦️",
    "10n": "🌧️",
    "11d": "⛈️",
    "11n": "⛈️",
    "13d": "❄️",
    "13n": "❄️",
    "50d": "🌫️",
    "50n": "🌫️",
  };
  return iconMap[iconCode] ?? "🌡️";
}

/**
 * Format temperature
 */
function formatTemp(kelvin: number, unit: "celsius" | "fahrenheit" = "celsius"): string {
  if (unit === "fahrenheit") {
    return `${Math.round(((kelvin - 273.15) * 9) / 5 + 32)}°F`;
  }
  return `${Math.round(kelvin - 273.15)}°C`;
}

/**
 * Format wind direction
 */
function formatWindDir(deg: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(deg / 45) % 8;
  return directions[index] ?? "N";
}

/**
 * Fetch weather from OpenWeatherMap
 */
async function fetchWeather(
  location: string,
  apiKey: string,
  options: { units?: "metric" | "imperial"; forecast?: boolean },
): Promise<WeatherResult> {
  try {
    // Geocoding to get coordinates
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
    const geoResponse = await fetch(geoUrl, { signal: AbortSignal.timeout(10000) });

    if (!geoResponse.ok) {
      return { success: false, error: `Geocoding failed: HTTP ${geoResponse.status}` };
    }

    const geoData = (await geoResponse.json()) as Array<{
      name: string;
      country: string;
      lat: number;
      lon: number;
    }>;

    if (!geoData.length) {
      return { success: false, error: `Location not found: ${location}` };
    }

    const { name, country, lat, lon } = geoData[0]!;

    // Get current weather
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const weatherResponse = await fetch(weatherUrl, { signal: AbortSignal.timeout(10000) });

    if (!weatherResponse.ok) {
      return { success: false, error: `Weather API failed: HTTP ${weatherResponse.status}` };
    }

    const weatherData = (await weatherResponse.json()) as {
      main: { temp: number; feels_like: number; humidity: number; pressure: number };
      wind: { speed: number; deg: number };
      clouds: { all: number };
      visibility: number;
      weather: Array<{ description: string; icon: string }>;
    };

    const result: WeatherData = {
      location: { name, country, lat, lon },
      current: {
        temp: weatherData.main.temp,
        feelsLike: weatherData.main.feels_like,
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        windSpeed: weatherData.wind.speed,
        windDir: weatherData.wind.deg,
        clouds: weatherData.clouds.all,
        visibility: weatherData.visibility,
        description: weatherData.weather[0]?.description ?? "Unknown",
        icon: weatherData.weather[0]?.icon ?? "01d",
      },
    };

    // Get forecast if requested
    if (options.forecast) {
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;
      const forecastResponse = await fetch(forecastUrl, { signal: AbortSignal.timeout(10000) });

      if (forecastResponse.ok) {
        const forecastData = (await forecastResponse.json()) as {
          list: Array<{
            dt_txt: string;
            main: { temp_min: number; temp_max: number };
            weather: Array<{ description: string; icon: string }>;
          }>;
        };

        // Group by day and get daily summary
        const dailyMap = new Map<string, (typeof forecastData.list)[0]>();
        for (const item of forecastData.list) {
          const date = item.dt_txt.split(" ")[0]!;
          if (!dailyMap.has(date)) {
            dailyMap.set(date, item);
          }
        }

        result.forecast = Array.from(dailyMap.entries())
          .slice(0, 5)
          .map(([date, item]) => ({
            date,
            tempMin: item.main.temp_min,
            tempMax: item.main.temp_max,
            description: item.weather[0]?.description ?? "Unknown",
            icon: item.weather[0]?.icon ?? "01d",
          }));
      }
    }

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch weather",
    };
  }
}

/**
 * Format weather data as readable text
 */
function formatWeather(data: WeatherData, unit: "celsius" | "fahrenheit" = "celsius"): string {
  const lines: string[] = [];
  const emoji = getWeatherEmoji(data.current.icon);

  lines.push(`${emoji} Weather for ${data.location.name}, ${data.location.country}`);
  lines.push("");
  lines.push(`🌡️ Temperature: ${formatTemp(data.current.temp, unit)}`);
  lines.push(`🤔 Feels like: ${formatTemp(data.current.feelsLike, unit)}`);
  lines.push(`💧 Humidity: ${data.current.humidity}%`);
  lines.push(`💨 Wind: ${data.current.windSpeed} m/s ${formatWindDir(data.current.windDir)}`);
  lines.push(`☁️ Clouds: ${data.current.clouds}%`);
  lines.push(`👁️ Visibility: ${(data.current.visibility / 1000).toFixed(1)} km`);
  lines.push(`📝 Condition: ${data.current.description}`);

  if (data.forecast?.length) {
    lines.push("");
    lines.push("📅 5-Day Forecast:");
    for (const day of data.forecast) {
      const dayEmoji = getWeatherEmoji(day.icon);
      lines.push(
        `  ${day.date}: ${dayEmoji} ${formatTemp(day.tempMin, unit)} - ${formatTemp(day.tempMax, unit)}, ${day.description}`,
      );
    }
  }

  return lines.join("\n");
}

/**
 * Create the weather tool
 */
export function createWeatherTool(params: WeatherToolParams = {}) {
  return {
    name: "weather",
    description: `Get current weather and forecast for any location.

Features:
- Current temperature, humidity, wind, visibility
- 5-day forecast
- Support for Celsius and Fahrenheit
- Weather condition descriptions and icons

Requires OpenWeatherMap API key (OPENWEATHERMAP_API_KEY env var or config).`,
    inputSchema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City name or location (e.g., 'Tokyo', 'New York, US', 'London, UK').",
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "Temperature unit. Default is celsius.",
        },
        forecast: {
          type: "boolean",
          description: "Include 5-day forecast. Default is false.",
        },
        apiKey: {
          type: "string",
          description: "OpenWeatherMap API key override.",
        },
      },
      required: ["location"],
    },
    call: async (input: {
      location: string;
      unit?: "celsius" | "fahrenheit";
      forecast?: boolean;
      apiKey?: string;
    }): Promise<WeatherResult> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiKey =
        input.apiKey ??
        (params.config?.tools as any)?.weather?.apiKey ??
        process.env.OPENWEATHERMAP_API_KEY ??
        "";

      if (!apiKey) {
        return {
          success: false,
          error:
            "OpenWeatherMap API key not configured. Set OPENWEATHERMAP_API_KEY environment variable.",
        };
      }

      const result = await fetchWeather(input.location, apiKey, {
        forecast: input.forecast ?? false,
      });

      if (result.success && result.data) {
        result.formatted = formatWeather(result.data, input.unit);
      }

      return result;
    },
  };
}
