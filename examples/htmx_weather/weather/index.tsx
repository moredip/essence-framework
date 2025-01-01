export async function get({ queryParams }) {
  const locationQuery = queryParams["location"]

  const weather = await getWeatherAndLocationNameFor(locationQuery)

  return (
    <div>
      <h3>
        Weather for <em>{weather.locationName}</em>
      </h3>
      <div>
        Current temperature: {weather.currentTemp}
        {weather.tempUnit}
      </div>
    </div>
  )
}

type WeatherAtLocation = {
  locationName: string
  currentTemp: string
  tempUnit: string
}
async function getWeatherAndLocationNameFor(locationQuery: string): Promise<WeatherAtLocation> {
  const location = await fetchGeocode(locationQuery)
  const weather = await fetchWeatherForecast(location)

  return {
    locationName: location.name,
    currentTemp: weather.current.temperature_2m,
    tempUnit: weather.current_units.temperature_2m,
  }
}

async function fetchGeocode(location: string) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      location,
    )}&count=1&language=en&format=json`,
  )
  const payload = await res.json()
  console.debug(payload)
  return payload["results"][0]
}

async function fetchWeatherForecast({ latitude, longitude }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`
  console.debug({ url })
  const res = await fetch(url)
  const payload = await res.json()
  console.debug(payload)
  return payload
}
