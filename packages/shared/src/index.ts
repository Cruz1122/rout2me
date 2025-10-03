export const APP_NAME = 'rout2me';

export interface User {
  id: string;
  name: string;
  email: string;
}

export type BusLocation = {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
};
