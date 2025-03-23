export async function getLocationFromCoordinates(lat: number, long: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}&zoom=10`,
      {
        headers: {
          'User-Agent': 'PestID-GBIF-Dashboard/1.0',
          'Accept-Language': 'en'
        }
      }
    );

    if (!response.ok) {
      console.error('Geocoding API error:', response.status, response.statusText);
      return 'Location unavailable';
    }

    const data = await response.json();
    
    // If no error but also no address data
    if (!data.address) {
      console.warn('No address data found for coordinates:', lat, long);
      return `${lat.toFixed(6)}, ${long.toFixed(6)}`;
    }

    // Extract relevant location information
    const address = data.address;
    const parts = [];

    // Build location string from most specific to least specific
    if (address.suburb) parts.push(address.suburb);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);

    return parts.join(', ') || `${lat.toFixed(6)}, ${long.toFixed(6)}`;
  } catch (error) {
    console.error('Error fetching location:', error);
    return `${lat.toFixed(6)}, ${long.toFixed(6)}`;
  }
}
