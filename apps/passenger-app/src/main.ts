import { APP_NAME, BusLocation } from '@rout2me/shared';

const currentLocation: BusLocation = {
  id: 'bus-001',
  latitude: -12.0464,
  longitude: -77.0428,
  timestamp: new Date(),
};

console.log(`${APP_NAME} Passenger App started`);
console.log('Current bus location:', currentLocation);
