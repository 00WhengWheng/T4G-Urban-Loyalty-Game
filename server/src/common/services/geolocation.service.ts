import axios from 'axios';

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface Address {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}

export class GeolocationService {
    // Example: Reverse geocoding using OpenStreetMap Nominatim API
    async reverseGeocode(coords: Coordinates): Promise<Address | null> {
        try {
            const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
                params: {
                    lat: coords.latitude,
                    lon: coords.longitude,
                    format: 'json',
                },
            });

            const data = response.data;
            return {
                street: data.address.road,
                city: data.address.city || data.address.town || data.address.village,
                state: data.address.state,
                country: data.address.country,
                postalCode: data.address.postcode,
            };
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            return null;
        }
    }

    // Example: Calculate distance between two coordinates (Haversine formula)
    calculateDistance(a: Coordinates, b: Coordinates): number {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const R = 6371e3; // Earth radius in meters

        const lat1 = toRad(a.latitude);
        const lat2 = toRad(b.latitude);
        const deltaLat = toRad(b.latitude - a.latitude);
        const deltaLon = toRad(b.longitude - a.longitude);

        const aVal =
            Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));

        return R * c; // Distance in meters
    }

    // Validate if coordinates are within valid ranges
    isValidCoordinate(latitude: number, longitude: number): boolean {
        return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
    }
}

export const geolocationService = new GeolocationService();