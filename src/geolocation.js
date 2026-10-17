import { isInDemoArea } from './locations.js';

// One user-initiated reading. No watchPosition, persistence, or reverse geocoding.
export function detectLocation() {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext) {
      reject(new Error('Location needs HTTPS or localhost. Choose a landmark or try the demo location.'));
      return;
    }
    if (!navigator.geolocation) {
      reject(new Error('This browser doesn’t support location detection. Choose a landmark or try the demo location.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude, accuracy } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        reject(new Error('Your browser returned an unavailable position. Choose a landmark or try again.'));
        return;
      }
      resolve({ coordinates: [latitude, longitude], accuracy, inDemoArea: isInDemoArea(latitude, longitude) });
    }, error => {
      const messages = {
        1: 'Location permission was denied. You can allow it in browser settings, choose a landmark, or try the demo location.',
        2: 'Your location is unavailable right now. Choose a landmark, try again, or use the demo location.',
        3: 'Location detection timed out. Try again, choose a landmark, or use the demo location.',
      };
      reject(new Error(messages[error.code] || 'We couldn’t detect your location. Choose a landmark or try the demo location.'));
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
  });
}
