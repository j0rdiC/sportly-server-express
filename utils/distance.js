// -- Haversine formula -- http://www.movable-type.co.uk/scripts/latlong.html
// a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
// c = 2 ⋅ atan2( √a, √(1−a) )
// d = R ⋅ c

// where	φ is latitude, λ is longitude, R is earth’s radius (mean radius = 6,371km);
// note that angles need to be in radians to pass to trig functions!

const deg2rad = (deg) => deg * (Math.PI / 180)

const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km

  return d
}

const sortByDistance = (collection, lat, long) => {
  return collection.sort((a, b) => {
    const distA = getDistanceInKm(lat, long, a.location.lat, a.location.long)
    const distB = getDistanceInKm(lat, long, b.location.lat, b.location.long)
    return distA - distB
  })
}

module.exports = { sortByDistance, getDistanceInKm }

// give me lat and lon of madrid, spain
// give me lat and lon of barcelona, spain
// give me lat and lon of valencia, spain
// give me lat and lon of sevilla, spain
// give me lat and lon of bilbao, spain

const madrid = { name: 'Madrid', lat: 40.4167754, lon: -3.7037902 }
const barcelona = { name: 'Barna', lat: 41.3850639, lon: 2.1734035 }
const valencia = { name: 'Valencia', lat: 39.4699075, lon: -0.3773926 }
const sevilla = { name: 'Sev', lat: 37.3890924, lon: -5.9844589 }
const bilbao = { name: 'Bilb', lat: 43.2627099, lon: -2.9252803 }

const cities = [madrid, barcelona, valencia, sevilla, bilbao]

const sortCities = (cities, lat, lon) => {
  const sorted = cities.sort((a, b) => {
    const distA = getDistanceInKm(lat, lon, a.lat, a.lon)
    const distB = getDistanceInKm(lat, lon, b.lat, b.lon)
    return distA - distB
  })
  return sorted
}

// lat long of palma de mallorca, spain

const user = { name: 'Palma', lat: 39.5696005, lon: 2.6501603 }

const sorted = sortCities(cities, user.lat, user.lon)

// console.log(sorted)

const distanceToBarcelonaInKm = getDistanceInKm(user.lat, user.lon, barcelona.lat, barcelona.lon)

// console.log(distanceToBarcelonaInKm, 'km')
